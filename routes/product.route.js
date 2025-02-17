import express from 'express'
const productRouter = express.Router();
import { findCategories, findSubCategories, findCategoriesName,findSubCategoriesName, findItemName, findSubCategoriesBanding } from '../controllers/product.controller.js';

productRouter.get("/categories", findCategories);
productRouter.get("/categorie-name", findCategoriesName);
productRouter.post("/sub-category/:category_id", findSubCategories);
productRouter.get("/sub-categories-name", findSubCategoriesName);
productRouter.post("/category/:category_id", findSubCategoriesBanding);
productRouter.post("/item-name", findItemName);

export default productRouter;