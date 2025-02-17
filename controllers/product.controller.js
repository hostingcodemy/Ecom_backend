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

//======================find category name handler==================
export const findCategoriesName = async (req, res) => {
   try {
      const collection = db.collection('M_category');
      const categories = await collection.find({ belongs_to: '' }).toArray();

      const simplifiedCategories = categories.map((item) => ({
         category_id: item.category_id,
         category_name: item.category_name,
      }));

      res.status(200).json({
         status: true,
         message: "Category data found",
         data: simplifiedCategories,
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
            $match: { belongs_to: String(categoryId) }
         },
         {
            $lookup: {
               from: "M_image_reference",
               localField: "sub_category_id",
               foreignField: "sub_category_id",
               as: "subcategory_images"
            }
         },
         {
            $lookup: {
               from: "M_item",
               let: { subCategoryId: "$sub_category_id" },
               pipeline: [
                  {
                     $addFields: {
                        idAsNumber: { $toDouble: "$id" },
                        is_stock: { $toInt: "$is_stock" }
                     }
                  },
                  {
                     $match: {
                        $expr: { $eq: ["$idAsNumber", "$$subCategoryId"] }
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
                     $unwind: "$photo_paths"
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
                        "is_stock": "$$item.is_stock",
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

//========================= sub category name handler ===================
export const findSubCategoriesName = async (req, res) => {
   try {
      const collection = db.collection('M_sub_category');
      const result = await collection.find({}, { projection: { sub_category_id: 1, sub_category_name: 1, _id: 0 } }).toArray();

      if (result.length > 0) {
         res.status(200).json({
            message: 'Sub-categories fetched successfully',
            data: result
         });
      } else {
         res.status(404).json({ message: 'No sub-categories found' });
      }
   } catch (error) {
      console.error('Error fetching sub-categories:', error);
      res.status(500).json({ message: 'Server error' });
   }
};

//======================Item name handler==============================
export const findItemName = async (req, res) => {
   const { category_id } = req.body;

   if (!category_id) {
      return res.status(400).json({ message: "category_id is required" });
   }

   try {
      const subCategories = await db.collection("M_sub_category")
         .find({ belongs_to: category_id.toString() })
         .toArray();

      if (!subCategories.length) {
         return res.status(404).json({ message: "No subcategories found for this category" });
      }

      const subCategoryIds = subCategories.map(sub => sub.sub_category_id.toString());
      const items = await db.collection("M_item")
         .find({ id: { $in: subCategoryIds } })
         .project({ item_cd: 1, item_name: 1, _id: 0 })
         .toArray();

      if (!items.length) {
         return res.status(404).json({ message: "No items found for this category" });
      }

      res.json({ category_id, items });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
   }
};

//===================== Banding Info===================
export const findSubCategoriesBanding = async (req, res) => {
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

      // =====================find sub category with banding and images======================================
      const subcategories = await db.collection("M_sub_category").aggregate([
         {
            $match: { belongs_to: String(categoryId) }
         },
         {
            $lookup: {
               from: "M_image_reference",
               localField: "sub_category_id",
               foreignField: "sub_category_id",
               as: "subcategory_images"
            }
         },
         {
            $lookup: {
               from: "M_banding",
               let: { subCategoryId: { $toDouble: "$sub_category_id" } },
               pipeline: [
                  {
                     $match: {
                        $expr: { $eq: ["$sub_category_id", "$$subCategoryId"] }
                     }
                  }
               ],
               as: "bandings"
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
               "subcategory_images": {
                  $cond: {
                     if: { $gt: [{ $size: "$subcategory_images" }, 0] },
                     then: { $concat: [BASE_URL, "/", { $arrayElemAt: ["$subcategory_images.photo_path", 0] }] },
                     else: null
                  }
               },
               "bandings": 1
            }
         }
      ]).toArray();

      res.status(200).json({
         status: true,
         category_id: categoryId,
         data: subcategories.map(subcategory => ({
            sub_category_id: subcategory.sub_category_id,
            sub_category_name: subcategory.sub_category_name,
            sub_category_short_code: subcategory.sub_category_short_code,
            bandings: subcategory.bandings.map(banding => ({
               banding_id: banding.banding_id,
               banding_name: banding.banding_name,
               sub_category_id: banding.sub_category_id
            })),
            subcategory_image: subcategory.subcategory_images
         }))
      });
   } catch (error) {
      console.error('Error fetching categories and items:', error);
      res.status(500).json({
         status: false,
         message: 'Internal Server Error',
      });
   }
};

