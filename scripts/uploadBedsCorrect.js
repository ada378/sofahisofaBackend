import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cloudinary } from "../config/cloudinary.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BED_IMAGES_FOLDER = "C:\\Users\\dell\\Downloads\\luxury bed lucknow (1)";

async function uploadToCloudinary(imagePath) {
  const result = await cloudinary.uploader.upload(imagePath, {
    folder: "sofa-hi-sofa/beds",
    transformation: [{ width: 1200, height: 900, crop: "fill", quality: "auto:good" }]
  });
  return { url: result.secure_url };
}

async function uploadBeds() {
  try {
    console.log("🛏️ Uploading Beds...\n");
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected\n");
    
    let bedCategory = await Category.findOne({ slug: "bed" });
    if (!bedCategory) {
      bedCategory = await Category.create({ name: "Bed", slug: "bed" });
    }
    
    const allFiles = fs.readdirSync(BED_IMAGES_FOLDER).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    
    let count = 0;
    let batch = [];
    let productNum = 1;
    
    for (let i = 0; i < allFiles.length; i++) {
      batch.push(allFiles[i]);
      
      if (batch.length === 4 || i === allFiles.length - 1) {
        const name = `Luxury Bed ${productNum}`;
        const sku = `BED-${productNum.toString().padStart(3, '0')}`;
        
        console.log(`📦 ${name} (${batch.length} images)`);
        
        const imgs = [];
        for (const file of batch) {
          const uploaded = await uploadToCloudinary(path.join(BED_IMAGES_FOLDER, file));
          imgs.push({ url: uploaded.url, alt: name });
        }
        
        await Product.create({
          name,
          slug: `luxury-bed-${productNum}`,
          sku,
          description: `${name} - Premium solid wood bed`,
          category: bedCategory._id,
          subCategory: "Luxury Bed",
          images: imgs,
          price: 45000 + (productNum * 2000),
          marketPrice: 65000 + (productNum * 2000),
          material: "Sheesham Wood",
          dimensions: { width: 180, height: 120, depth: 210, unit: "cm" },
          fabricOptions: ["Charcoal Velvet", "Cream Linen", "Navy Blue", "Beige"],
          stock: 5,
          rating: 4.5,
          numReviews: 10,
          warranty: "10 Years"
        });
        
        console.log(`✅ Created\n`);
        count++;
        batch = [];
        productNum++;
      }
    }
    
    console.log(`🎉 Done! ${count} products created\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌", error.message);
    process.exit(1);
  }
}

uploadBeds();
