import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

// Configure lazily so process.env is fully loaded by the time this runs
const getCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
};

// Product images storage
const productStorage = new CloudinaryStorage({
  cloudinary: getCloudinary(),
  params: {
    folder: "sofahisofa/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 900, crop: "limit", quality: "auto:good", fetch_format: "auto" }],
  },
});

// Category images storage
const categoryStorage = new CloudinaryStorage({
  cloudinary: getCloudinary(),
  params: {
    folder: "sofahisofa/categories",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 600, height: 600, crop: "fill", gravity: "auto", quality: "auto:good" }],
  },
});

export const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
}).array("images", 8);

export const uploadCategoryImage = multer({
  storage: categoryStorage,
  limits: { fileSize: 4 * 1024 * 1024 },
}).single("image");

export { cloudinary };
