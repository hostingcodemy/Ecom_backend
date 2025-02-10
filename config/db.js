import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

let client;
let db;

async function connectToDatabase() {
   try {
      client = new MongoClient(process.env.DB_URI, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
      });

      await client.connect();
     
      db = client.db(process.env.DB_NAME);

      console.log("Connected to MongoDB Atlas successfully");
   } catch (error) {
      console.error("Error connecting to MongoDB Atlas:", error);
      process.exit(1); 
   }
}
await connectToDatabase();

export default db;
