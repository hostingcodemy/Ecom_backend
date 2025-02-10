import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import moment from "moment-timezone";
import jwt from "jsonwebtoken";

export const authenticator=async (req, res) => {
    try {
       const collection = db.collection("M_user");
       const customerCollection = db.collection("M_customer");
      
      //  field check
       const { phone, password } = req.body;
       if (!phone || !password) {
          return res
             .status(400)
             .json({ status: false, message: "Phone number and password are required." });
       }
       
      //  is user valid
       const user = await collection.findOne({ phone });
       if (!user) {
          return res
             .status(400)
             .json({ status: false, message: "Invalid phone number or password." });
       }
       
       //  is password valid
       const isPasswordValid = await bcrypt.compare(password, user.password);
       if (!isPasswordValid) {
          return res
             .status(400)
             .json({ status: false, message: "Invalid phone number or password." });
       }
       
      //  is jwt secret available
       const jwtSecret = process.env.JWT_SECRET_KEY;
       if (!jwtSecret) {
          return res
             .status(500)
             .json({ status: false, message: "JWT_SECRET_KEY is not defined in environment variables." });
       }
 
      //  payload for token
       const payload = {
          _id: user._id,
          phone: user.phone,
          role_name: user.role_name,
       };
 
       const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' }); // token generated
       const tokenExpiration = moment().add(1, 'hours').toDate().toLocaleString(); // max age 1 hour
       
      //  token updated to db
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
   
      //  is the user is also a customer
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
 
       // sending response to the logged in user
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
 };