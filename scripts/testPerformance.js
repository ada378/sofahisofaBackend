import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const mongoURI = "mongodb+srv://adarsh03542_db_user:TTGN9Tzll8KDcQVy@sofahisofa.osv0yii.mongodb.net/?appName=SofahiSofa";

async function testPerformance() {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected\n");

    // Test 1: Get all products with pagination
    console.log("🔍 Test 1: Paginated products query");
    const start1 = Date.now();
    const products = await Product.find({})
      .limit(12)
      .skip(0)
      .populate('category', 'name slug');
    const end1 = Date.now();
    console.log(`✅ Fetched ${products.length} products in ${end1 - start1}ms\n`);

    // Test 2: Get products by category
    console.log("🔍 Test 2: Filter by category");
    const category = await Category.findOne({ slug: 'sofa' });
    const start2 = Date.now();
    const sofas = await Product.find({ category: category._id })
      .limit(12)
      .populate('category', 'name slug');
    const end2 = Date.now();
    console.log(`✅ Fetched ${sofas.length} sofas in ${end2 - start2}ms\n`);

    // Test 3: Get bestsellers
    console.log("🔍 Test 3: Filter bestsellers");
    const start3 = Date.now();
    const bestsellers = await Product.find({ isBestSeller: true })
      .limit(12)
      .populate('category', 'name slug');
    const end3 = Date.now();
    console.log(`✅ Fetched ${bestsellers.length} bestsellers in ${end3 - start3}ms\n`);

    // Test 4: Get product by slug
    console.log("🔍 Test 4: Get single product by slug");
    const firstProduct = products[0];
    const start4 = Date.now();
    const singleProduct = await Product.findOne({ slug: firstProduct.slug })
      .populate('category', 'name slug');
    const end4 = Date.now();
    console.log(`✅ Fetched product "${singleProduct.name}" in ${end4 - start4}ms\n`);

    // Test 5: Count total products
    console.log("🔍 Test 5: Count total products");
    const start5 = Date.now();
    const count = await Product.countDocuments();
    const end5 = Date.now();
    console.log(`✅ Counted ${count} products in ${end5 - start5}ms\n`);

    // Summary
    console.log("📊 Performance Summary:");
    console.log(`- Paginated query: ${end1 - start1}ms`);
    console.log(`- Category filter: ${end2 - start2}ms`);
    console.log(`- Bestsellers filter: ${end3 - start3}ms`);
    console.log(`- Single product: ${end4 - start4}ms`);
    console.log(`- Count query: ${end5 - start5}ms`);
    
    const avgTime = ((end1 - start1) + (end2 - start2) + (end3 - start3) + (end4 - start4) + (end5 - start5)) / 5;
    console.log(`\n⚡ Average query time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 100) {
      console.log("✅ Performance: EXCELLENT (< 100ms)");
    } else if (avgTime < 200) {
      console.log("✅ Performance: GOOD (< 200ms)");
    } else if (avgTime < 500) {
      console.log("⚠️ Performance: ACCEPTABLE (< 500ms)");
    } else {
      console.log("❌ Performance: NEEDS OPTIMIZATION (> 500ms)");
    }

    // Check indexes
    console.log("\n🔍 Checking indexes...");
    const indexes = await Product.collection.getIndexes();
    console.log("Indexes found:", Object.keys(indexes).length);
    Object.keys(indexes).forEach(key => {
      console.log(`  - ${key}: ${JSON.stringify(indexes[key])}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testPerformance();
