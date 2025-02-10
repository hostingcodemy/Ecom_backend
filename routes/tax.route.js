import express from 'express';
import { taxHandler,taxItemwise,taxLocationWise,taxBillTable } from '../controllers/tax.controller.js';

const taxRouter=express.Router();
taxRouter.post("/tax-entry",taxHandler);
taxRouter.post("/tax-itemwise",taxItemwise);
taxRouter.post("/tax-locationwise",taxLocationWise);
taxRouter.post("/tax-bill-table",taxBillTable);

export default taxRouter;