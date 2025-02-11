import express from 'express'
import { adminRegister, addCategory, addItem, logout, addCompany, royalty, cardRedemption, allCustomers, allUsers, findCustomerAgainstUser,CustomerOrders,addSubCategory } from '../controllers/admin.controller.js';
import { authenticator } from '../auth/auth.js';
import { upload } from '../middlewares/multer.middleware.js';

const adminRouter = express.Router();

adminRouter.post("/admin-register", adminRegister);
adminRouter.post("/authenticate", authenticator);
adminRouter.post("/add-category", upload.single('photo'), addCategory);
adminRouter.post("/add-sub-category", upload.single('photo'), addSubCategory);
adminRouter.post("/add-item", upload.array('photo', 4), addItem);
adminRouter.post("/add-company", upload.fields([
  { name: 'logo', maxCount: 1 },  // company logo
  { name: 'picture', maxCount: 1 }   // company picture
]), addCompany);
adminRouter.post("/add-royalty", royalty);
adminRouter.post("/card_redeem", cardRedemption);
adminRouter.get("/all-customers", allCustomers);
adminRouter.get("/customer_orders/:id", CustomerOrders);
adminRouter.get("/all_users", allUsers); //on test
adminRouter.get("/all_user_customer/:_id", findCustomerAgainstUser); //on test
adminRouter.get("/logout", logout);

export default adminRouter;