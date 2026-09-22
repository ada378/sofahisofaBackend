import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import dotenv from "dotenv";

dotenv.config();

async function deleteBedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected\n");
    
    const bedCategory = await Category.findOne({ slug: "bed" });
    if (!bedCategory) {
      console.log("No bed category found");
      process.exit(0);
    }
    
    const result = await Product.deleteMany({ category: bedCategory._id });
    console.log(`🗑️  Deleted ${result.deletedCount} bed products\n`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

deleteBedProducts();
