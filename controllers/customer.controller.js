import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import nodemailer from "nodemailer";

// =====================Function to generate a 16-digit order id======================
const generateOrderId = () => {
   return crypto.randomBytes(8).toString("hex").toUpperCase();
};

// =====================Function to generate a 16-digit order number======================
const generateOrderNumber = async () => {
   // Get the current date
   const now = new Date();
   const currentYear = now.getFullYear();
   const currentMonth = now.getMonth() + 1; // JS months are 0-based

   // Determine financial year (April to March)
   let financialYear;
   if (currentMonth >= 4) {
      financialYear = `${currentYear.toString().slice(-2)}${(currentYear + 1).toString().slice(-2)}`;
   } else {
      financialYear = `${(currentYear - 1).toString().slice(-2)}${currentYear.toString().slice(-2)}`;
   }

   // Fetch the latest order number from DB for this financial year
   const lastOrder = await db.collection("M_order_details")
      .find({ orderNumber: new RegExp(`^YMC${financialYear}`) })
      .sort({ orderNumber: -1 })
      .limit(1)
      .toArray();

   // Determine the next order number
   let nextNumber = 1;
   if (lastOrder.length > 0) {
      const lastOrderNumber = lastOrder[0].orderNumber;
      const lastSequence = parseInt(lastOrderNumber.slice(8), 10); // Extract last number part
      nextNumber = lastSequence + 1;
   }

   // Format the new order number
   const orderNumber = `YMC${financialYear}${String(nextNumber).padStart(9, "0")}`;
   return orderNumber;
};

//==================Email part==================
const transporter = nodemailer.createTransport({
   host: "smtp.ethereal.email",
   port: 587,
   secure: false,
   service: "Gmail",
   auth: {
      user: "rai.ebits@gmail.com",
      pass: "uajklqegkmzjxtqg",
   },
});

// =====================customer register handler======================
export const customerRegister = async (req, res) => {
   try {
      const {
         first_name,
         last_name,
         phone,
         email,
         password,
         P_pinCode,
         P_state,
         P_city,
         P_houseNo,
         P_building,
         P_roadName,
         D_pinCode,
         D_state,
         D_city,
         D_houseNo,
         D_building,
         D_roadName,
      } = req.body;

      // field validation check
      if (!phone || !email || !password) {
         return res.status(400).json({ status: false, message: 'test-Required fields are missing' });
      }

      // validate phone length
      if (phone.length > 15) {
         return res
            .status(400)
            .json({ status: false, message: "Phone number must not exceed 15 digits." });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         return res.status(400).json({ status: false, message: "Invalid email address provided." });
      }

      // is user already exists
      const findUser = await db.collection('M_user').findOne({ $or: [{ email }, { phone }] })
      if (findUser) {
         return res.status(400).json({
            status: false, message: 'Email or phone is already exists.'
         })
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // new user created
      const newUser = {
         first_name: first_name || "",
         last_name: last_name || "",
         phone: phone || "",
         email: email || "",
         password: hashedPassword,
         role_id: 2, // role id 2 used as customer flag
         role_name: 'CUSTOMER',
         is_login: 0,
         token: '',
         created_at: new Date().toLocaleString(),
         updated_at: new Date().toLocaleString(),
      };

      const userResult = await db.collection('M_user').insertOne(newUser);
      const userId = userResult.insertedId; // the object_id of inserted data

      // if user data comes from customer, then saving it as customer's data
      const newCustomer = {
         customer_id: userId,
         first_name: first_name || "",
         last_name: last_name || "",
         phone: phone || "",
         email: email || "",
         P_pinCode: P_pinCode || "",
         P_state: P_state || "",
         P_city: P_city || "",
         P_houseNo: P_houseNo || "",
         P_building: P_building || "",
         P_roadName: P_roadName || "",
         D_pinCode: D_pinCode || "",
         D_state: D_state || "",
         D_city: D_city || "",
         D_houseNo: D_houseNo || "",
         D_building: D_building || "",
         D_roadName: D_roadName || "",
         created_at: new Date().toLocaleString(),
         updated_at: new Date().toLocaleString(),
      };

      const customerResult = await db.collection('M_customer').insertOne(newCustomer);

      res.status(200).json({
         status: true,
         message: `User with email id- ${email} registered successfully`,
         data: { customer_id: userId, role_name: 'CUSTOMER' },
      });

   } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({
         status: false,
         message: 'Server error, please try again later',
      });
   }
};


// =====================customer address update handler======================
export const addressUpdate = async (req, res) => {
   try {
      console.log(req.body);
      const { customer_id, first_name, last_name, phone, email, D_houseNo, D_building, D_roadName, D_city, D_state, D_pinCode } = req.body;

      if (!customer_id || !D_houseNo || !D_building || !D_roadName || !D_city || !D_state || !D_pinCode) {
         return res.status(400).json({ success: false, message: 'All fields are required' });
      }
      const collection = db.collection('M_customer');

      // the customer_id is saved as ObjectId, so parsing it.
      const result = await collection.updateOne(
         { customer_id: new ObjectId(customer_id) },
         {
            $set: {
               first_name,
               last_name,
               phone,
               email,
               D_houseNo,
               D_building,
               D_roadName,
               D_city,
               D_state,
               D_pinCode,
            },
         }
      );

      // is customer previous delivery details not exists
      if (result.matchedCount === 0) {
         return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      return res.status(200).json({
         success: true,
         message: 'Address updated successfully',
      });
   } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
   }
}

// =====================order place handler======================
// export const placeOrder = async (req, res) => {

//    try {
//       const { customerId, cartItems } = req.body;
//       console.log(customerId, cartItems,'jj');


//       if (!customerId || !cartItems || cartItems.length === 0) {
//          return res.status(400).json({ status: false, message: "Invalid request data" });
//       }

//       const customer = await db.collection('M_customer').findOne({ customer_id: new ObjectId(customerId) });

//       if (!customer) {
//          return res.status(404).json({ status: false, message: "Customer not found" });
//       }

//       const customerDetails = await db.collection('M_user').findOne({ _id: new ObjectId(customerId) });

//       if (!customer.D_building || !customer.D_city || !customer.D_houseNo || !customer.D_pinCode || !customer.D_roadName || !customer.D_state) {
//          return res.status(400).json({ success: false, message: "delivery address is not available" });
//       }

//       const deliveryDetails = {
//          first_name: customer.first_name,
//          last_name: customer.last_name,
//          phone: customer.phone,
//          email: customer.email,
//          pinCode: customer.D_pinCode,
//          state: customer.D_state,
//          city: customer.D_city,
//          houseNo: customer.D_houseNo,
//          building: customer.D_building,
//          roadName: customer.D_roadName,
//       };

//       const orderId = generateOrderId();
//       const orderNumber = await generateOrderNumber();

//       const orders = cartItems.map((item) => {
//          const grossAmount = item.price * item.quantity;
//          const cgst = (grossAmount * 9) / 100; // 9% CGST
//          const sgst = (grossAmount * 9) / 100; // 9% SGST
//          const totalTax = cgst + sgst;
//          const payableAmount = grossAmount + totalTax;

//          return {
//             orderId: orderId,
//             orderNumber: orderNumber,
//             orderDate: new Date().toLocaleString(),
//             customerId: customerId,
//             productId: item.productId,
//             itemId: item.itemId,
//             productName: item.productName,
//             quantity: item.quantity,
//             type: item.type,
//             grossAmount: grossAmount,
//             offerAmount: 0,
//             redemptionAmount: 0,
//             discount: 0,
//             tax: totalTax.toFixed(2),
//             payableAmount: payableAmount.toFixed(2),
//             deliveryDetails: deliveryDetails,
//          };
//       });

//       await db.collection('M_order_details').insertMany(orders);

//       return res.status(200).json({
//          status: true,
//          message: "Order placed successfully!",
//          orderId: orderId,
//          orderNumber: orderNumber,
//       });

//    } catch (error) {
//       console.error("Order Placement Error:", error);
//       return res.status(500).json({
//          status: false,
//          message: "Internal Server Error",
//       });
//    }
// };

export const placeOrder = async (req, res) => {
   try {
      const { customerId, cartItems } = req.body;

      if (!customerId || !cartItems || cartItems.length === 0) {
         return res.status(400).json({ status: false, message: "Invalid request data" });
      }

      // Fetch customer details
      const customer = await db.collection("M_customer").findOne({ customer_id: new ObjectId(customerId) });

      if (!customer) {
         return res.status(404).json({ status: false, message: "Customer not found" });
      }

      if (!customer.D_building || !customer.D_city || !customer.D_houseNo || !customer.D_pinCode || !customer.D_roadName || !customer.D_state) {
         return res.status(400).json({ success: false, message: "Delivery address is not available" });
      }

      const deliveryDetails = {
         first_name: customer.first_name,
         last_name: customer.last_name,
         phone: customer.phone,
         email: customer.email,
         pinCode: customer.D_pinCode,
         state: customer.D_state,
         city: customer.D_city,
         houseNo: customer.D_houseNo,
         building: customer.D_building,
         roadName: customer.D_roadName,
      };

      const orderId = generateOrderId();
      const orderNumber = await generateOrderNumber();

      const orders = cartItems.map((item) => {
         const grossAmount = item.price * item.quantity;
         const cgst = (grossAmount * 9) / 100;
         const sgst = (grossAmount * 9) / 100;
         const totalTax = cgst + sgst;
         const payableAmount = grossAmount + totalTax;

         return {
            orderId: orderId,
            orderNumber: orderNumber,
            orderDate: new Date().toLocaleString(),
            customerId: customerId,
            productId: item.item_id,
            itemId: item.item_cd,
            productName: item.item_name,
            quantity: item.quantity,
            type: item.isWholesale ? "wholesale" : "retail",
            grossAmount: grossAmount,
            offerAmount: 0,
            redemptionAmount: 0,
            discount: 0,
            tax: totalTax.toFixed(2),
            payableAmount: payableAmount.toFixed(2),
            deliveryDetails: deliveryDetails,
         };
      });

      await db.collection("M_order_details").insertMany(orders);

      // Construct email content
      let orderDetailsHtml = `
           <h2>Order Confirmation</h2>
           <p>Thank you for your order, ${deliveryDetails.first_name} ${deliveryDetails.last_name}!</p>
           <p><strong>Order Number:</strong> ${orderNumber}</p>
           <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
           <h3>Delivery Address</h3>
           <p>${deliveryDetails.houseNo}, ${deliveryDetails.building}, ${deliveryDetails.roadName},<br>
           ${deliveryDetails.city}, ${deliveryDetails.state}, ${deliveryDetails.pinCode}</p>
           <h3>Order Summary</h3>
           <table border="1" cellspacing="0" cellpadding="8">
               <tr>
                   <th>Product</th>
                   <th>Quantity</th>
                   <th>Price</th>
                   <th>Total</th>
               </tr>
       `;

      orders.forEach((order) => {
         orderDetailsHtml += `
               <tr>
                   <td>${order.productName}</td>
                   <td>${order.quantity}</td>
                   <td>₹${order.grossAmount.toFixed(2)}</td>
                   <td>₹${order.payableAmount}</td>
               </tr>
           `;
      });

      orderDetailsHtml += `
           </table>
           <p><strong>Total Payable Amount:</strong> ₹${orders.reduce((sum, order) => sum + parseFloat(order.payableAmount), 0).toFixed(2)}</p>
           <p>We will notify you when your order is out for delivery.</p>
           <p>Best regards, <br>YELOMYCART Team</p>
       `;

      // Send email
      await transporter.sendMail({
         from: 'rai.ebits@gmail.com',
         to: customer.email,
         subject: "Order Confirmation - " + orderNumber,
         html: orderDetailsHtml,
      });

      return res.status(200).json({
         status: true,
         message: "Order placed successfully!",
         orderId: orderId,
         orderNumber: orderNumber,
      });

   } catch (error) {
      console.error("Order Placement Error:", error);
      return res.status(500).json({
         status: false,
         message: "Internal Server Error",
      });
   }
};

// ========================find customer orders========================


export const allOrders = async (req, res) => {
   try {
      const { customerId } = req.body;
      const findUser = await db.collection("M_customer").findOne({ customer_id: new ObjectId(customerId) });
      const findCustomerOrders = await db.collection("M_order_details").find({ customerId: customerId }).toArray();
      if (findCustomerOrders.length == 0) {
         return res.status(200).json({
            status: true,
            message: "custmer orders not found"
         })
      }

      res.status(200).json({
         message: true,
         total: findCustomerOrders.length,
         findCustomerOrders
      })
   } catch (error) {
      console.error("Find order Error:", error);
      return res.status(500).json({
         status: false,
         message: "Internal Server Error",
      })
   }
}

// =====================logout handler======================
export const logout = (req, res) => {
   res.clearCookie('token');
   return res.json({ Status: true, message: "user logged out" });
};