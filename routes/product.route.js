import express from 'express'
const productRouter=express.Router();
import { findCategories,findSubCategories } from '../controllers/product.controller.js';

productRouter.get("/categories",findCategories);
productRouter.post("/sub-category/:category_id",findSubCategories);

export default productRouter;