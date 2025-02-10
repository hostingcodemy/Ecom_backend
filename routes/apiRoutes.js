import express from "express";
import db from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import moment from "moment-timezone";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();

const JWT_SECRET_KEY = 'your_jwt_secret_key';
const TOKEN_EXPIRATION_DAYS = 60;
const timezone = 'Asia/Kolkata';
const BASE_URL = "http://127.0.0.1:3000/uploads";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, uploadDir);
   },
   filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
   },
});

const upload = multer({ storage: storage });

const formatDateForDatabase = (date) => {
   const d = new Date(date);
   const year = d.getFullYear();
   const month = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   const hours = String(d.getHours()).padStart(2, '0');
   const minutes = String(d.getMinutes()).padStart(2, '0');
   const seconds = String(d.getSeconds()).padStart(2, '0');
   return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const verifyToken = (req, res, next) => {
   let token = req.headers["authorization"];

   if (token && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
   } else {
      token = req.headers["token"];
   }

   if (!token) {
      return res.status(401).json({ success: false, message: "Token not provided" });
   }

   jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
         if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token has expired" });
         }
         return res.status(401).json({ success: false, message: "Invalid token" });
      }
      req.user = decoded;
      next();
   });
};


// Function to generate a 16-digit order number
const generateOrderNumber = () => {
   return crypto.randomBytes(8).toString("hex").toUpperCase();
};


//Admin registration
router.post("/admin-register", async (req, res) => {
   try {
      const collection = db.collection("M_user");

      const { first_name, last_name, phone, email, password } = req.body;
      if (!first_name || !last_name || !phone || !email || !password) {
         return res
            .status(400)
            .json({ status: false, message: "All fields are required." });
      }

      if (phone.length > 15) {
         return res
            .status(400)
            .json({ status: false, message: "Phone number must not exceed 15 digits." });
      }

      // Validate email format
      //   const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      //   if (!emailRegex.test(email)) {
      //     return res.status(400).json({ status: false, message: "Invalid email format." });
      //   }

      const existingUser = await collection.findOne({
         $or: [{ email }, { phone }],
      });
      if (existingUser) {
         return res
            .status(400)
            .json({ status: false, message: "Email or phone already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
         token: "",
         first_name,
         last_name,
         phone,
         email,
         password: hashedPassword,
         role_id: 1,
         role_name: "ADMIN",
         created_at: new Date(),
         updated_at: new Date(),
      };

      const result = await collection.insertOne(newUser);
      newUser._id = result.insertedId;

      return res.status(200).json({
         status: true,
         message: "Admin registered successfully.",
         data: {
            _id: newUser._id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            phone: newUser.phone,
            email: newUser.email,
            role_id: newUser.role_id,
            role_name: newUser.role_name,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at,
         },
      });
   } catch (error) {
      console.error(error);
      return res.status(500).json({ status: false, message: "Server error." });
   }
});

//Customer registration
router.post('/customer-register', async (req, res) => {
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

      if (!phone || !email || !password) {
         return res.status(400).json({ status: false, message: 'Required fields are missing' });
      }

      if (!P_pinCode || !P_state || !P_city || !P_houseNo || !P_building || !P_roadName) {
         return res.status(400).json({ status: false, message: 'Permanent address fields are missing' });
      }

      if (!D_pinCode || !D_state || !D_city || !D_houseNo || !D_building || !D_roadName) {
         return res.status(400).json({ status: false, message: 'Delivery address fields are missing' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
         first_name: first_name || "",
         last_name: last_name || "",
         phone: phone || "",
         email: email || "",
         password: hashedPassword,
         role_id: 2,
         role_name: 'CUSTOMER',
         is_login: 0,
         token: '',
         created_at: new Date(),
         updated_at: new Date(),
      };

      const userResult = await db.collection('M_user').insertOne(newUser);
      const userId = userResult.insertedId;

      const newCustomer = {
         customer_id: userId,
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
         created_at: new Date(),
         updated_at: new Date(),
      };

      const customerResult = await db.collection('M_customer').insertOne(newCustomer);

      res.status(200).json({
         status: true,
         message: 'User registered successfully',
         data: { customer_id: userId, role_name: 'CUSTOMER' },
      });

   } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({
         status: false,
         message: 'Server error, please try again later',
      });
   }
});

//login for both admin and customer
router.post("/authenticate", async (req, res) => {
   try {
      const collection = db.collection("M_user");
      const customerCollection = db.collection("M_customer");

      const { phone, password } = req.body;
      if (!phone || !password) {
         return res
            .status(400)
            .json({ status: false, message: "Phone number and password are required." });
      }

      const user = await collection.findOne({ phone });
      if (!user) {
         return res
            .status(400)
            .json({ status: false, message: "Invalid phone number or password." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
         return res
            .status(400)
            .json({ status: false, message: "Invalid phone number or password." });
      }

      const jwtSecret = JWT_SECRET_KEY;
      if (!jwtSecret) {
         return res
            .status(500)
            .json({ status: false, message: "JWT_SECRET_KEY is not defined in environment variables." });
      }

      const payload = {
         _id: user._id,
         phone: user.phone,
         role_name: user.role_name,
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
      const tokenExpiration = moment().add(1, 'hours').toDate();

      await collection.updateOne(
         { phone },
         {
            $set: {
               token,
               token_expiry: tokenExpiration,
               is_login: 1
            }
         }
      );
  
      const customerData = await customerCollection.findOne({ customer_id: user._id });
      

      let customerDetails = {};
      if (customerData) {
         customerDetails = {
            D_pinCode: customerData.D_pinCode || "",
            D_state: customerData.D_state || "",
            D_city: customerData.D_city || "",
            D_houseNo: customerData.D_houseNo || "",
            D_building: customerData.D_building || "",
            D_roadName: customerData.D_roadName || "",
         };
      }

      return res.status(200).json({
         status: true,
         message: "Login successful.",
         data: {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            email: user.email,
            token,
            token_expiry: tokenExpiration,
            role_id: user.role_id,
            role_name: user.role_name,
            is_login: 1,
            customer_details: customerDetails, 
         }
      });

   } catch (error) {
      console.error(error);
      return res.status(500).json({ status: false, message: "Server error." });
   }
});



//Add Category
router.post('/add-category', upload.single('photo'), async (req, res) => {
   try {
      const counter = await db.collection('counters').findOne({ _id: "category_id" });
      let nextCategoryId;

      if (counter) {
         nextCategoryId = counter.sequence_value + 1;
         await db.collection('counters').updateOne(
            { _id: "category_id" },
            { $set: { sequence_value: nextCategoryId } }
         );
      } else {
         nextCategoryId = 1;
         await db.collection('counters').insertOne({
            _id: "category_id",
            sequence_value: nextCategoryId
         });
      }

      const newCategory = {
         category_id: nextCategoryId,
         category_name: req.body.category_name || "",
         category_short_code: req.body.category_short_code || "",
         group: req.body.group || "",
         sub_group: req.body.sub_group || "",
         opening_quantity: req.body.opening_quantity || "0.00",
         opening_value: req.body.opening_value || "0.00",
         belongs_under: req.body.belongs_under || "",
         belongs_to: req.body.belongs_to || "",
         is_active: req.body.is_active || 1,
         cbu: req.body.cbu || "admin",
         cud: req.body.cud || "admin",
         ulm: moment().toISOString(),
         dlm: moment().toISOString(),
         created_at: moment().toISOString(),
         updated_at: moment().toISOString()
      };
      const categoryResult = await db.collection('M_category').insertOne(newCategory);

      if (req.file) {
         const photoReference = {
            category_id: nextCategoryId,
            photo_path: req.file ? req.file.filename : null,
            created_at: moment().toISOString(),
            updated_at: moment().toISOString()
         };

         await db.collection('M_image_reference').insertOne(photoReference);
      }

      res.status(200).json({
         status: true,
         message: "Category added successfully",
         data: {
            ...newCategory,
            _id: categoryResult.insertedId
         }
      });
   } catch (error) {
      console.error("Error inserting category or photo:", error);
      res.status(500).json({
         status: false,
         error: "Failed to insert category or photo"
      });
   }
});

//Category list
router.get('/categories', async (req, res) => {
   try {
      const collection = db.collection('M_category');
      const categories = await collection.find({ belongs_to: '' }).toArray();
      res.status(200).json({
         status: true,
         message: "Category data found",
         data: categories,
      });
   } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
         status: false,
         message: 'Internal Server Error',
      });
   }
});

//Sub-Category list
router.post('/sub-category/:category_id', async (req, res) => {
   try {
      const { category_id } = req.params;
      const categoryId = parseInt(category_id, 10);

      if (isNaN(categoryId)) {
         return res.status(400).json({
            status: false,
            message: 'Invalid category_id, it must be a number',
         });
      }

      const collection = db.collection('M_category');
      const parentCategory = await collection.findOne({ category_id: categoryId });

      if (!parentCategory) {
         return res.status(404).json({
            status: false,
            message: 'Parent category not found',
         });
      }

      const categories = await collection.aggregate([
         {
            $match: { belongs_to: String(categoryId) }
         },
         {
            $lookup: {
               from: 'M_item',
               let: { category_id: { $toString: "$category_id" } },
               pipeline: [
                  {
                     $match: {
                        $expr: {
                           $eq: ["$id", "$$category_id"]
                        }
                     }
                  }
               ],
               as: 'items'
            }
         },
         {
            $project: {
               "_id": 1,
               "category_id": 1,
               "description": 1,
               "belongs_to": 1,
               "is_active": 1,
               "items": {
                  $map: {
                     input: "$items",
                     as: "item",
                     in: {
                        item_cd: "$$item.item_cd",
                        id: "$$item.id",
                        name: "$$item.description",
                        rating: "$$item.rating",
                        rp_price: "$$item.rp",
                        wsp_price: "$$item.wsp",
                        photo: { $concat: [BASE_URL, "/", "$$item.photo"] }
                     }
                  }
               }
            }
         }
      ]).toArray();

      res.status(200).json({
         status: true,
         category_id: categoryId,
         description: parentCategory.description,
         data: categories
      });
   } catch (error) {
      console.error('Error fetching categories and items:', error);
      res.status(500).json({
         status: false,
         message: 'Internal Server Error',
      });
   }
});

//Add Item
router.post('/add-item', upload.single('photo'), async (req, res) => {
   try {
      const { description, id, details, rating, rp, wsp, cbu, cud } = req.body;

      if (!description || !id || !details || !rating || !rp || !wsp || !cbu || !cud) {
         return res.status(400).json({ status: false, error: 'All fields are required except photo.' });
      }

      if (rating < 0 || rating > 5) {
         return res.status(400).json({ status: false, error: 'Rating must be between 0 and 5.' });
      }

      const counter = await db.collection('counters').findOneAndUpdate(
         { _id: "item_cd" },
         { $inc: { sequence_value: 1 } },
         { returnDocument: "after", upsert: true }
      );

      const itemCount = await db.collection('M_item').countDocuments();
      const newItem = {
         item_cd: itemCount + 1,
         description,
         id,
         details,
         rating: parseFloat(rating),
         rp: parseFloat(rp),
         wsp: parseFloat(wsp),
         photo: req.file ? req.file.filename : null,
         cbu,
         cud,
         ulm: new Date(),
         dlm: new Date(),
         created_at: new Date(),
         updated_at: new Date(),
      };

      const result = await db.collection('M_item').insertOne(newItem);

      res.status(200).json({
         status: true,
         message: 'Item created successfully',
         item: { ...newItem, _id: result.insertedId },
      });
   } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Internal server error' });
   }
});

//Order details
router.post("/place-order", async (req, res) => {

   try {
      const { customerId, cartItems } = req.body;

      // Validate request data
      if (!customerId || !cartItems || cartItems.length === 0) {
         return res.status(400).json({ status: false, message: "Invalid request data" });
      }

      // Fetch customer details for delivery address
      const customer = await db.collection('M_customer').findOne({ customer_id: customerId });

      // Check if customer exists
      // if (!customer) {
      //    return res.status(404).json({ status: false, message: "Customer not found" });
      // }

      // Construct delivery address from M_customer collection
      // const deliveryAddress = {
      //    pinCode: customer.D_pinCode,
      //    state: customer.D_state,
      //    city: customer.D_city,
      //    houseNo: customer.D_houseNo,
      //    building: customer.D_building,
      //    roadName: customer.D_roadName,
      // };

      // Generate a 16-digit order number
      const orderNumber = generateOrderNumber();

      // Prepare order details for insertion into M_order_details
      const orders = cartItems.map((item) => {
         const grossAmount = item.price * item.quantity;
         const cgst = (grossAmount * 9) / 100; // 9% CGST
         const sgst = (grossAmount * 9) / 100; // 9% SGST
         const totalTax = cgst + sgst;
         const payableAmount = grossAmount + totalTax;

         return {
            orderNumber: orderNumber,
            orderDate: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            customerId: customerId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            type: item.type,
            grossAmount: grossAmount,
            offerAmount: 0,
            redemptionAmount: 0,
            discount: 0,
            tax: totalTax.toFixed(2),
            payableAmount: payableAmount.toFixed(2),
            // deliveryAddress: deliveryAddress,
         };
      });

      // Insert orders into M_order_details collection
      await db.collection('M_order_details').insertMany(orders);

      // Success response
      return res.status(200).json({
         status: true,
         message: "Order placed successfully!",
         orderNumber: orderNumber,
      });

   } catch (error) {
      console.error("Order Placement Error:", error);
      return res.status(500).json({
         status: false,
         message: "Internal Server Error",
      });
   }
});


router.get('/logout', (req, res) => {
   res.clearCookie('token');
   return res.json({ Status: true });
});

export { router as apiRoutes };
