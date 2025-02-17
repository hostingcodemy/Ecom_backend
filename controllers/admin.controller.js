import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import moment from "moment-timezone";
import { ObjectId } from 'mongodb';
import sharp from 'sharp';
import fs from 'fs';
import { log } from 'console';

const BASE_URL = "http://127.0.0.1:3000/uploads";

// ====================admin register handler====================================
export const adminRegister = async (req, res) => {
   try {
      const collection = db.collection("M_user");

      // fields check
      const { first_name, last_name, phone, email, password } = req.body;
      if (!first_name || !last_name || !phone || !email || !password) {
         return res
            .status(400)
            .json({ status: false, message: "All fields are required." });
      }

      //  phone length check
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

      //  check if user already exist
      const existingUser = await collection.findOne({
         $or: [{ email }, { phone }],
      });
      if (existingUser) {
         return res
            .status(400)
            .json({ status: false, message: "Email or phone already exists." });
      }

      // password hashing
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
         token: "",
         first_name,
         last_name,
         phone,
         email,
         password: hashedPassword,
         role_id: 1, // role id 1 used as admin flag
         role_name: "ADMIN",
         created_at: new Date().toLocaleString(),
         updated_at: new Date().toLocaleString(),
      };

      const result = await collection.insertOne(newUser);
      newUser._id = result.insertedId;

      //  respone send to the frontend
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
};

// ====================add new category handler====================================
export const addCategory = async (req, res) => {
   try {
      const {
         category_name,
         category_short_code,
         group_name,
         sub_group_name,
         opening_quantity,
         opening_value,
         belongs_under,
         belongs_to,
         is_active
      } = req.body;
      const counter = await db.collection('counters').findOne({ _id: "category_id" });
      let nextCategoryId;

      // category counter
      // setting the category id as next sequence value else created one 
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

      // creating a new category
      const newCategory = {
         category_id: nextCategoryId,
         category_name: category_name || "",
         category_short_code: category_short_code || "",
         group_name: group_name || "",
         sub_group_name: sub_group_name || "",
         opening_quantity: opening_quantity || "0.00",
         opening_value: opening_value || "0.00",
         belongs_under: belongs_under || "",
         belongs_to: belongs_to || "",
         is_active: is_active || 1,
         cbu: "admin",
         cud: "admin",
         ulm: new Date().toLocaleString(),
         dlm: new Date().toLocaleString(),
      };
      const categoryResult = await db.collection('M_category').insertOne(newCategory);

      // saving the photo paths in M_image_reference collection with category id
      if (req.file) {
         // const filePath = req.file.path;
         // const tempFilePath = `${filePath}-temp.jpg`;
         // await sharp(filePath).resize(600, 400).toFile(tempFilePath); // sharping the photo to 400*600
         // fs.renameSync(tempFilePath, filePath);
         const photoReference = {
            category_id: nextCategoryId,
            photo_path: req.file ? req.file.filename : null,
            created_at: new Date().toLocaleString(),
            updated_at: new Date().toLocaleString()
         };

         await db.collection('M_image_reference').insertOne(photoReference);
      }

      // sending the response to the frontend
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
};

// ====================add new sub category handler====================================
export const addSubCategory = async (req, res) => {
   try {
      const {
         sub_category_name,
         sub_category_short_code,
         serial_number,
         group_name,
         sub_group_name,
         opening_quantity,
         opening_value,
         belongs_under,
         belongs_to,
         is_active
      } = req.body;
      const counter = await db.collection('counters').findOne({ _id: "sub_category_id" });
      let nextSubCategoryId;

      // category counter
      // setting the category id as next sequence value else created one 
      if (counter) {
         nextSubCategoryId = counter.sequence_value + 1;
         await db.collection('counters').updateOne(
            { _id: "sub_category_id" },
            { $set: { sequence_value: nextSubCategoryId } }
         );
      } else {
         nextSubCategoryId = 1;
         await db.collection('counters').insertOne({
            _id: "sub_category_id",
            sequence_value: nextSubCategoryId
         });
      }

      // creating a new category
      const newSubCategory = {
         sub_category_id: nextSubCategoryId,
         sub_category_name: sub_category_name || "",
         sub_category_short_code: sub_category_short_code || "",
         serial_number: serial_number || "",
         group_name: group_name || "",
         sub_group_name: sub_group_name || "",
         opening_quantity: opening_quantity || "0.00",
         opening_value: opening_value || "0.00",
         belongs_under: belongs_under || "",
         belongs_to: belongs_to || "",
         is_active: is_active || 1,
         cbu: "admin",
         cud: "admin",
         ulm: new Date().toLocaleString(),
         dlm: new Date().toLocaleString(),
      };
      const categoryResult = await db.collection('M_sub_category').insertOne(newSubCategory);
      // saving the photo paths in M_image_reference collection with category id
      if (req.file) {
         // const filePath = req.file.path;
         // const tempFilePath = `${filePath}-temp.jpg`;
         // await sharp(filePath).resize(600, 400).toFile(tempFilePath); // sharping the photo to 400*600
         // fs.renameSync(tempFilePath, filePath);
         const photoReference = {
            sub_category_id: nextSubCategoryId,
            photo_path: req.file ? req.file.filename : null,
            created_at: new Date().toLocaleString(),
            updated_at: new Date().toLocaleString()
         };

         await db.collection('M_image_reference').insertOne(photoReference);
      }

      // sending the response to the frontend
      res.status(200).json({
         status: true,
         message: "Category added successfully",
         data: {
            ...newSubCategory,
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
};

// ====================add new item handler====================================
export const addItem = async (req, res) => {
   try {
      const { item_name, id, details, rating, rp, wsp, cbu, cud } = req.body;
   console.log(req.body,'pp')

      // field chack
      // if (!item_name || !id || !details || !rating || !rp || !wsp || !cbu || !cud) {
      //    return res.status(400).json({ status: false, error: 'All fields are required except photo.' });
      // }

      // rating can not be negative or above 5
      if (rating < 0 || rating > 5) {
         return res.status(400).json({ status: false, error: 'Rating must be between 0 and 5.' });
      }

      // item counter increasing
      const counter = await db.collection('counters').findOneAndUpdate(
         { _id: "item_cd" },
         { $inc: { sequence_value: 1 } },
         { returnDocument: "after", upsert: true }
      );

      // counting previous documents and adding a new
      const itemCount = await db.collection('M_item').countDocuments();
      const newItem = {
         item_cd: itemCount + 1,
         item_name,
         id,
         details,
         rating,
         rp,
         wsp,
         cbu,
         cud,
         ulm: new Date().toLocaleString(),
         dlm: new Date().toLocaleString(),
         //created_at: new Date().toLocaleString(),
         //updated_at: new Date().toLocaleString(),
      };

      const result = await db.collection('M_item').insertOne(newItem);

      // mapping the image files into an array
      const filePaths = await Promise.all(
         req.files.map(async (file) => {
            //   const filePath = file.path;
            //   const tempFilePath = `${filePath}-temp.jpg`;

            //   await sharp(filePath)
            //     .resize(600, 400)
            //     .toFile(tempFilePath); // Resize the photo to 600x400

            //   fs.renameSync(tempFilePath, filePath);

            //   return file.filename; // Return the processed file path
            return file.filename; // Return the processed file path
         })
      );

      // saving the filepaths into M_image_reference collection with item_cd
      if (filePaths.length != 0) {
         const photoReference = {
            item_cd: itemCount + 1,
            photo_paths: filePaths,
            created_at: moment().toISOString(),
            updated_at: moment().toISOString()
         };
         console.log(photoReference);

         await db.collection('M_image_reference').insertOne(photoReference);
      }

      // sending response to the frontend
      res.status(200).json({
         status: true,
         message: 'Item created successfully',
         item: { ...newItem, _id: result.insertedId },
      });
   } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Internal server error' });
   }
};

// ====================logout handler====================================
export const logout = (req, res) => {
   res.clearCookie('token');
   return res.json({ Status: true });
};

// ====================new company create handler====================================
export const addCompany = async (req, res) => {
   try {
      const { name, address, phone, email, gst, pan, cin, tin, password } = req.body;

      // field check
      if (!name || !address || !phone || !email || !gst || !pan || !cin || !tin || !password) {
         return res.status(400).json({ status: false, error: 'All fields are required' });
      }

      // phone length check
      if (phone.length > 15) {
         return res
            .status(400)
            .json({ status: false, message: "Phone number must not exceed 15 digits." });
      }

      // is company exists
      const findCompany = await db.collection('M_channel').findOne({ pan })
      if (findCompany) {
         return res.status(400).json({
            status: false, message: 'company already exists'
         })
      }

      // company counter increased
      const counter = await db.collection('counters').findOneAndUpdate(
         { _id: "company_cd" },
         { $inc: { sequence_value: 1 } },
         { returnDocument: "after", upsert: true }
      );

      // counting previous documents and adding a new
      const companyCount = await db.collection('M_channel').countDocuments();
      const newCompany = {
         company_id: companyCount + 1,
         name,
         address,
         phone,
         email,
         gst,
         pan,
         cin,
         tin,
         active: 1,
         ulm: new Date().toLocaleString(),
         dlm: new Date().toLocaleString(),
         created_at: new Date().toLocaleString(),
         updated_at: new Date().toLocaleString(),
         redemption_applicable_from: ""
      };

      const result = await db.collection('M_channel').insertOne(newCompany);

      // saving the photo paths with company_id
      // const filePath = req.files['picture'][0].path;
      // const tempFilePath = `${filePath}-temp.jpg`;
      // await sharp(filePath).resize(600, 400).toFile(tempFilePath); // sharping the photo to 400*600
      // fs.renameSync(tempFilePath, filePath);

      const photoReference = {
         company_id: companyCount + 1,
         photo_paths: {
            logo: req.files['logo'][0].filename,
            picture: req.files['picture'][0].filename
         },
         created_at: new Date().toLocaleString(),
         updated_at: new Date().toLocaleString(),
      };

      await db.collection('M_image_reference').insertOne(photoReference);

      //sending response to frontend
      res.status(200).json({
         status: true,
         message: 'Company created successfully',
         item: { ...newCompany, _id: result.insertedId, photos: photoReference.photo_paths },
      });
   } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Internal server error' });
   }
}

// ====================royalty handler====================================
export const royalty = async (req, res) => {
   try {
      const { sales_amount, royalty_point, royalty_amount, exchange_rate } = req.body;
      if (!sales_amount || !royalty_point || !royalty_amount || !exchange_rate) {
         return res.status(400).json({ status: false, error: 'All fields are required' });
      }
      const counter = await db.collection('counters').findOne({ _id: "royalty_id" });
      let nextRoyaltyId;
      // royalty
      // setting the royalty id as next sequence value else created one 
      if (counter) {
         nextRoyaltyId = counter.sequence_value + 1;
         await db.collection('counters').updateOne(
            { _id: "royalty_id" },
            { $set: { sequence_value: nextRoyaltyId } }
         );
      } else {
         nextRoyaltyId = 1;
         await db.collection('counters').insertOne({
            _id: "royalty_id",
            sequence_value: nextRoyaltyId
         });
      }

      const royalty = {
         royalty_id: nextRoyaltyId,
         sales_amount: sales_amount,
         royalty_point: royalty_point,
         royalty_amount: royalty_amount,
         exchange_rate: exchange_rate,
         created_by: "ADMIN",
         created_at: new Date().toLocaleString(),
         ulm: new Date().toLocaleString(),
         dlm: new Date().toLocaleString(),
         active: 1
      }
      const result = await db.collection("M_royalty").insertOne(royalty);
      res.status(200).json({
         status: true,
         message: "royalty credentials added"
      })

   } catch (error) {
      console.error('Error creating royalty:', error);
      res.status(500).json({
         status: false,
         message: 'Internal Server Error',
      });
   }
}

// ====================card redemption handler====================================
export const cardRedemption = async (req, res) => {
   try {
      const counter = await db.collection('counters').findOne({ _id: "card_redemption_id" });
      let nextRedemptionId;

      // setting the royalty id as next sequence value else created one 
      if (counter) {
         nextRedemptionId = counter.sequence_value + 1;
         await db.collection('counters').updateOne(
            { _id: "card_redemption_id" },
            { $set: { sequence_value: nextRedemptionId } }
         );
      } else {
         nextRedemptionId = 1;
         await db.collection('counters').insertOne({
            _id: "card_redemption_id",
            sequence_value: nextRedemptionId
         });
      }

      const redemption = {
         royalty_id: nextRedemptionId,
         member_id: "",
         belonh_to: "",
         doc_no: "",
         ref_doc_no: "",
         doc_date: "",
         doc_amount: "",
         amount_receive: "",
         amount_paid: "",
         amount_balance: "",
         rwd_point: "",
         rwd_list: "",
         redeem_point: "",
         narr: "",
         fnc_year: "",
         tt: "",
         created_by: "",
         created_at: new Date().toLocaleString(),
         ulm: new Date().toLocaleString(),
         dlm: new Date().toLocaleString(),
         active: 1,
         enc_type: "",
         card_no: ""
      }
      const result = await db.collection("tfa_card_redemption").insertOne(redemption);
      res.status(200).json({
         status: true,
         message: result
      })

   } catch (error) {
      console.error('Error card redemption:', error);
      res.status(500).json({
         status: false,
         message: 'Internal Server Error',
      });
   }
}

// ====================find all customers handler====================================
export const allCustomers = async (req, res) => {
   try {
      const findCustomers = await db.collection("M_customer").find().toArray();
      if (findCustomers.length == 0) {
         return res.status(200).json({
            status: true,
            message: "custmers not found"
         })
      }

      res.status(200).json({
         message: true,
         total: findCustomers.length,
         findCustomers
      })
   } catch (error) {
      console.error("Find customer Error:", error);
      return res.status(500).json({
         status: false,
         message: "Internal Server Error",
      })
   }
}


export const CustomerOrders = async (req, res) => {
   try {
      const { id } = req.params;
      const findCustomerOrders = await db.collection("M_order_details").find({ customerId: id }).toArray();
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
      console.error("Find customer orders Error:", error);
      return res.status(500).json({
         status: false,
         message: "Internal Server Error",
      })
   }
}

// ====================find all users handler====================================
// ============================on testing====================
export const allUsers = async (req, res) => {
   try {
      const findUsers = await db.collection("M_user").find().toArray();
      if (findUsers.length == 0) {
         return res.status(200).json({
            status: true,
            message: "custmers not found"
         })
      }

      res.status(200).json({
         message: true,
         total: findUsers.length,
         findUsers
      })
   } catch (error) {
      console.error("Find user Error:", error);
      return res.status(500).json({
         status: false,
         message: "Internal Server Error",
      })
   }
}

// ====================find all customers against user handler=========================
// ============================on testing====================
export const findCustomerAgainstUser = async (req, res) => {
   try {
      const { _id } = req.params;
      console.log(req.params);
      const findCustomerAgainstUser = await db.collection("M_customer").find({ "customer_id": _id }).toArray();
      if (findCustomerAgainstUser.length == 0) {
         return res.status(200).json({
            status: true,
            message: "custmers not found against the user"
         })
      }

      res.status(200).json({
         message: true,
         total: findCustomerAgainstUser.length,
         findCustomerAgainstUser
      })
   } catch (error) {
      console.error("Find customer for user Error:", error);
      return res.status(500).json({
         status: false,
         message: "Internal Server Error",
      })
   }
}


//=======================Add banding===================
export const addBanding = async (req, res) => {
   try {
      const {
         banding_name,
         banding_short_code,
         sub_category_id,
         is_active
      } = req.body;
      
      const counter = await db.collection('counters').findOne({ _id: "banding_id" });
      let nextBandingId;
     
      if (counter) {
         nextBandingId = counter.sequence_value + 1;
         await db.collection('counters').updateOne(
            { _id: "banding_id" },
            { $set: { sequence_value: nextBandingId } }
         );
      } else {
         nextBandingId = 1;
         await db.collection('counters').insertOne({
            _id: "banding_id",
            sequence_value: nextBandingId
         });
      }

      // creating a new banding
      const newBanding = {
         banding_id: nextBandingId,
         banding_name: banding_name || "",
         banding_short_code: banding_short_code || "",
         sub_category_id: sub_category_id ,
         is_active: is_active || 1,
         cbu: "admin",
         cud: "admin",
         ulm: new Date().toLocaleString(),
         dlm: new Date().toLocaleString(),
      };
      const bandingResult = await db.collection('M_banding').insertOne(newBanding);

      // sending the response to the frontend
      res.status(200).json({
         status: true,
         message: "Banding added successfully",
         data: {
            ...newBanding,
            _id: bandingResult.insertedId
         }
      });
   } catch (error) {
      console.error("Error inserting category or photo:", error);
      res.status(500).json({
         status: false,
         error: "Failed to insert category or photo"
      });
   }
};