import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const mongoURI = "mongodb+srv://adarsh03542_db_user:TTGN9Tzll8KDcQVy@sofahisofa.osv0yii.mongodb.net/?appName=SofahiSofa";

async function getRealImages() {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");

    // Get all products with populated category
    const products = await Product.find({}).populate('category', 'name slug').select("name images category");

    console.log(`\n📦 Total products found: ${products.length}`);
    
    const sofas = products.filter(p => p.category?.slug === 'sofa').slice(0, 3);
    const beds = products.filter(p => p.category?.slug === 'bed').slice(0, 2);
    const chairs = products.filter(p => p.category?.slug === 'chair').slice(0, 2);
    const dining = products.filter(p => p.category?.slug === 'dining-table').slice(0, 2);

    console.log("\n📸 SOFAS:");
    sofas.forEach(p => console.log(`${p.name}: ${p.images[0]?.url || 'No image'}`));
    
    console.log("\n🛏️ BEDS:");
    beds.forEach(p => console.log(`${p.name}: ${p.images[0]?.url || 'No image'}`));
    
    console.log("\n🪑 CHAIRS:");
    chairs.forEach(p => console.log(`${p.name}: ${p.images[0]?.url || 'No image'}`));
    
    console.log("\n🍽️ DINING:");
    dining.forEach(p => console.log(`${p.name}: ${p.images[0]?.url || 'No image'}`));

    console.log("\n\n=== JSON OUTPUT ===");
    console.log(JSON.stringify({
      sofas: sofas.map(p => ({ name: p.name, image: p.images[0]?.url })),
      beds: beds.map(p => ({ name: p.name, image: p.images[0]?.url })),
      chairs: chairs.map(p => ({ name: p.name, image: p.images[0]?.url })),
      dining: dining.map(p => ({ name: p.name, image: p.images[0]?.url }))
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

getRealImages();
