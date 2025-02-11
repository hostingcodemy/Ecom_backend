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
               image: `${BASE_URL}/${image?.photo_path}`
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


// =====================find sub category with items======================================
      const subcategories = await db.collection("M_sub_category").aggregate([
         {
            $match: { belongs_to: String(categoryId) }  // Filter subcategories by categoryId
         },
         {
            $lookup: {
               from: "M_image_reference",  // Get subcategory images
               localField: "sub_category_id",
               foreignField: "sub_category_id",
               as: "subcategory_images"
            }
         },
         {
            $lookup: {
               from: "M_item",
               let: { subCategoryId: "$sub_category_id" },  // Passing sub_category_id to the lookup pipeline
               pipeline: [
                  {
                     $addFields: {
                        idAsNumber: { $toDouble: "$id" }  // Convert id to a number
                     }
                  },
                  {
                     $match: {
                        $expr: { $eq: ["$idAsNumber", "$$subCategoryId"] }  // Compare converted id with sub_category_id
                     }
                  }
               ],
               as: "items"
            }
         },
         {
            $lookup: {
               from: "M_image_reference",
               let: { itemCodes: "$items.item_cd" },
               pipeline: [
                  {
                     $match: {
                        $expr: { $in: ["$item_cd", "$$itemCodes"] }
                     }
                  },
                  {
                     $unwind: "$photo_paths"  // Unwind the photo_path array to process each image individually
                  }
               ],
               as: "item_images"
            }
         },
         {
            $project: {
               "_id": 1,
               "sub_category_id": 1,
               "sub_category_name": 1,
               "sub_category_short_code": 1,
               "serial_number": 1,
               "group_name": 1,
               "sub_group_name": 1,
               "opening_quantity": 1,
               "opening_value": 1,
               "belongs_under": 1,
               "belongs_to": 1,
               "is_active": 1,
               // Subcategory photo
               "subcategory_photo": {
                  $cond: {
                     if: { $gt: [{ $size: "$subcategory_images" }, 0] },
                     then: { $concat: [BASE_URL, "/", { $arrayElemAt: ["$subcategory_images.photo_path", 0] }] },
                     else: null
                  }
               },
               // Items and their images
               "items": {
                  $map: {
                     input: "$items",
                     as: "item",
                     in: {
                        "item_cd": "$$item.item_cd",
                        "item_name": "$$item.item_name",
                        "item_id": "$$item.id",
                        "details": "$$item.details",
                        "rating": "$$item.rating",
                        "rp": "$$item.rp",
                        "wsp": "$$item.wsp",
                        "item_images": {
                           $map: {
                              input: {
                                 $filter: {
                                    input: "$item_images",
                                    as: "img",
                                    cond: { $eq: ["$$img.item_cd", "$$item.item_cd"] }  // Ensure matching item_cd
                                 }
                              },
                              as: "img",
                              in: { $concat: [BASE_URL, "/", "$$img.photo_paths"] }  // Since photo_path is unwound, no array here
                           }
                        }
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
         data: subcategories
      });
   } catch (error) {
      console.error('Error fetching categories and items:', error);
      res.status(500).json({
         status: false,
         message: 'Internal Server Error',
      });
   }
};