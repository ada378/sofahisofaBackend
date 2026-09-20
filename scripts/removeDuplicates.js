import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";

dotenv.config();

function cleanName(name) {
  // Remove numbers in parentheses like (72), (73) etc
  return name.replace(/\s*\(\d+\)\s*$/g, '').trim();
}

async function main() {
  console.log("\n🔍 FINDING AND REMOVING DUPLICATE PRODUCTS...\n");
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected\n");

    const allProducts = await Product.find({}).sort({ createdAt: 1 });
    console.log(`📦 Total products: ${allProducts.length}\n`);

    // Group products by clean name
    const groups = {};
    
    for (const product of allProducts) {
      const cleanProductName = cleanName(product.name);
      
      if (!groups[cleanProductName]) {
        groups[cleanProductName] = [];
      }
      groups[cleanProductName].push(product);
    }

    // Find duplicates (groups with more than 1 product)
    const duplicateGroups = Object.entries(groups).filter(([_, products]) => products.length > 1);

    console.log(`📊 Found ${duplicateGroups.length} groups with duplicates:\n`);

    let totalDeleted = 0;

    for (const [cleanProductName, products] of duplicateGroups) {
      console.log(`\n📂 ${cleanProductName} (${products.length} products)`);
      
      // Keep the first one, delete the rest
      const toKeep = products[0];
      const toDelete = products.slice(1);

      console.log(`   ✅ KEEPING: ${toKeep.name} (ID: ${toKeep._id})`);
      
      for (const product of toDelete) {
        console.log(`   ❌ DELETING: ${product.name} (ID: ${product._id})`);
        await Product.deleteOne({ _id: product._id });
        totalDeleted++;
      }
    }

    const remainingCount = allProducts.length - totalDeleted;

    console.log("\n" + "=".repeat(70));
    console.log("✅ DUPLICATES REMOVED!");
    console.log(`   • Total products before: ${allProducts.length}`);
    console.log(`   • Deleted: ${totalDeleted} duplicate products`);
    console.log(`   • Remaining: ${remainingCount} unique products`);
    console.log("=".repeat(70) + "\n");

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
