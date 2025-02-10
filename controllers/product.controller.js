import db from "../config/db.js";

const BASE_URL = "http://127.0.0.1:3000/uploads"; //image base url

// =====================find category handler======================
export const findCategories = async (req, res) => {
   try {
      const collection = db.collection('M_category');
      const categories = await collection.find({ belongs_to: '' }).toArray();

      // Use Promise.all to wait for all asynchronous operations to complete
      const categoryWithImage = await Promise.all(
         categories.map(async (item) => {
            const image = await db.collection("M_image_reference").findOne({ category_id: item.category_id });
            return {
               ...item,
               image
            };
         })
      );

      res.status(200).json({
         status: true,
         message: "Category data found",
         data: categoryWithImage,
      });
   } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
         status: false,
         message: 'Internal Server Error',
      });
   }
};


// =====================find sub category handler======================
export const findSubCategories = async (req, res) => {
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
};