import express from "express";
import cors from 'cors';
import adminRouter from "./routes/admin.route.js";
import customerRouter from "./routes/customer.route.js";
import productRouter from "./routes/product.route.js";
import taxRouter from "./routes/tax.route.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';

const app = express()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const allowedOrigins = ["https://ecom-frontend-three-kappa.vercel.app"];

app.use(cors({
   origin: (origin, callback) => {
       if (!origin || allowedOrigins.includes(origin)) {
           callback(null, true);
       } else {
           callback(new Error("Not allowed by CORS"));
       }
   },
   methods: ['GET', 'POST', 'PUT', 'DELETE'],
   credentials: true
}));
app.options('*', cors());
app.use(express.json());
app.use(cookieParser());
app.use('/api',adminRouter);
app.use('/api',customerRouter);
app.use('/api',productRouter);
app.use('/api',taxRouter);
app.use(express.static('Public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
