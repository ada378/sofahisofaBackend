import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

dotenv.config();

async function main() {
  console.log("\n⭐ MARKING PRODUCTS AS BESTSELLERS...\n");
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected\n");

    // Get products by category
    const categories = ['chair', 'sofa', 'dining-table', 'bed'];
    
    let totalMarked = 0;

    for (const categorySlug of categories) {
      // Get category
      const categoryDoc = await Category.findOne({ slug: categorySlug });
      if (!categoryDoc) continue;

      // Get first 6 products from each category and mark as bestsellers & featured
      const products = await Product.find({ category: categoryDoc._id })
        .limit(6)
        .sort({ createdAt: -1 });

      console.log(`📦 ${categorySlug.toUpperCase()}: Found ${products.length} products`);

      for (const product of products) {
        await Product.updateOne(
          { _id: product._id },
          { 
            isBestSeller: true,
            isFeatured: true,
            isNewLaunch: true
          }
        );
        console.log(`   ✓ ${product.name}`);
        totalMarked++;
      }
      console.log();
    }

    console.log("=".repeat(60));
    console.log(`✅ SUCCESS! Marked ${totalMarked} products as BESTSELLERS`);
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
