import express from 'express'
import { customerRegister, addressUpdate, placeOrder, allOrders, logout } from '../controllers/customer.controller.js';
import { authenticator } from '../auth/auth.js';
const customerRouter = express.Router();

customerRouter.post("/customer-register", customerRegister);
customerRouter.post("/address-update", addressUpdate);
customerRouter.post("/authenticate", authenticator);
customerRouter.post("/place-order", placeOrder);
customerRouter.post("/all-orders", allOrders);
customerRouter.get("/logout", logout);

export default customerRouter;