import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get all sofas and beds
    const sofas = await Product.find({ 
      $or: [
        { name: /luxury Sofa/i },
        { name: /Chair.*Sofa/i }
      ]
    }).limit(20).select('name images');
    
    const beds = await Product.find({ name: /luxury bed/i }).limit(10).select('name images');
    
    console.log("\n=== SOFAS ===\n");
    sofas.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   ${p.images[0].url}\n`);
    });
    
    console.log("\n=== BEDS ===\n");
    beds.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   ${p.images[0].url}\n`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
