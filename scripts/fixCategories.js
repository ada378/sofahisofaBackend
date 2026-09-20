import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

dotenv.config();

// Ordered by specificity (check more specific keywords first)
const categoryMap = {
  "chair sofa": "sofa",
  "dining table": "dining-table",
  "dining set": "dining-table",
  "luxury sofa": "sofa",
  "luxury bed": "bed",
  "marble": "dining-table",
  "sofa": "sofa",
  "bed": "bed",
  "chair": "chair",
  "dining": "dining-table",
  "table": "dining-table",
};

function extractCategory(productName) {
  const lower = productName.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  return "furniture";
}

async function main() {
  console.log("\n🔧 FIXING PRODUCT CATEGORIES...\n");
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected\n");

    // Get all categories
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Get all products
    const products = await Product.find({}).populate('category');
    
    console.log(`📦 Found ${products.length} products\n`);
    
    let fixed = 0;
    let unchanged = 0;

    for (const product of products) {
      const correctCategorySlug = extractCategory(product.name);
      const correctCategoryId = categoryMap[correctCategorySlug];
      
      const currentCategorySlug = product.category?.slug || 'unknown';
      
      if (currentCategorySlug !== correctCategorySlug) {
        console.log(`🔄 ${product.name}`);
        console.log(`   OLD: ${currentCategorySlug} → NEW: ${correctCategorySlug}`);
        
        await Product.updateOne(
          { _id: product._id },
          { category: correctCategoryId }
        );
        fixed++;
      } else {
        unchanged++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ CATEGORIES FIXED!");
    console.log(`   • Fixed: ${fixed} products`);
    console.log(`   • Unchanged: ${unchanged} products`);
    console.log("=".repeat(60) + "\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
