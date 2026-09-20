import express from "express";
import { protect, admin } from "../middleware/auth.js";
import {
  uploadProductImages as uploadProductImagesCtrl,
  uploadCategoryImage as uploadCategoryImageCtrl,
  deleteImage,
} from "../controllers/uploadController.js";
import {
  uploadProductImages,
  uploadCategoryImage,
} from "../config/cloudinary.js";

const router = express.Router();

// Multer error wrapper — returns JSON instead of crashing
const handleMulterError = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (err) {
      console.error("Multer/Cloudinary upload error:", err);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// POST /api/upload/product-images — up to 8 images
router.post(
  "/product-images",
  protect,
  admin,
  handleMulterError(uploadProductImages),
  uploadProductImagesCtrl
);

// POST /api/upload/category-image — single image
router.post(
  "/category-image",
  protect,
  admin,
  handleMulterError(uploadCategoryImage),
  uploadCategoryImageCtrl
);

// DELETE /api/upload/:publicId — remove from Cloudinary
router.delete("/:publicId", protect, admin, deleteImage);

export default router;
