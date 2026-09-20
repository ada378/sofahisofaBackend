import { cloudinary } from "../config/cloudinary.js";

// @desc   Upload product images to Cloudinary (up to 8 at once)
// @route  POST /api/upload/product-images
// @access Admin
export const uploadProductImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    // multer-storage-cloudinary puts the result on req.files
    const images = req.files.map((file) => ({
      url: file.path,          // Cloudinary secure URL
      alt: file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      publicId: file.filename, // Cloudinary public_id (used for deletion)
    }));
    res.json({ images });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// @desc   Upload single category image to Cloudinary
// @route  POST /api/upload/category-image
// @access Admin
export const uploadCategoryImage = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({
      url: req.file.path,
      alt: req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      publicId: req.file.filename,
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// @desc   Delete an image from Cloudinary by publicId
// @route  DELETE /api/upload/:publicId
// @access Admin
export const deleteImage = async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};
