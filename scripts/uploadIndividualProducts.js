import fs from "fs";
import path from "path";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import slugify from "slugify";

dotenv.config();

const dirname = path.dirname(fileURLToPath(import.meta.url));

import Category from "../models/Category.js";
import Product from "../models/Product.js";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ordered by specificity (check more specific keywords first)
const categoryMap = {
  "chair sofa": "sofa",        // Check compound keywords first
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

function extractCategory(filename) {
  const lower = filename.toLowerCase();
  // Check in order of specificity
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  return "furniture";
}

function cleanProductName(filename) {
  let name = filename
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/Lucknow/gi, "")
    .replace(/Sofahisofa/gi, "")
    .replace(/from/gi, "")
    .trim();
  
  return name || "Premium Furniture";
}

function generateDescription(productName, category) {
  const templates = {
    chair: `Premium handcrafted ${productName} featuring solid wood construction and ergonomic design. Built with high-quality materials for everyday comfort and durability. Perfect addition to any modern Indian home with expert craftsmanship and attention to detail.`,
    sofa: `Luxury ${productName} with solid sheesham wood frame and high-resilience foam cushioning. Designed for ultimate comfort in Indian living rooms. Features elegant upholstery and durable construction with 10-year frame warranty.`,
    bed: `Premium ${productName} featuring solid wood construction with superior mattress support. Architectural design meets comfort with lifetime termite protection. Perfect for modern bedrooms with elegant finishing.`,
    "dining-table": `Elegant ${productName} combining style with functionality. Crafted from premium materials with sturdy construction. Perfect centerpiece for family gatherings with easy maintenance and timeless design.`,
    furniture: `Premium ${productName} with expert craftsmanship and high-quality materials. Designed for comfort, durability, and style. Comes with warranty and free delivery across India.`,
  };
  
  return templates[category] || templates.furniture;
}

function generateShortDescription(productName, category) {
  return `Premium ${productName} - ${category.charAt(0).toUpperCase() + category.slice(1)} Collection`;
}

function generateSeoTitle(productName) {
  return `${productName} | Buy Premium Furniture Online | Sofa Hi Sofa`;
}

function generateSeoDescription(productName, category) {
  return `Buy ${productName} online at best price. Premium ${category}, 10-year warranty, free delivery. Direct from factory with quality assurance.`;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadWithRetry(filePath, category, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: `sofa-hi-sofa/${category}`,
        resource_type: "auto",
        quality: "auto",
        timeout: 30000,
      });
      return result;
    } catch (err) {
      if (attempt < retries) {
        await delay(1000);
      } else {
        console.log(`⚠️ SKIP`);
        return null;
      }
    }
  }
}

async function main() {
  const inputFolder = process.argv[2] || "C:\\Users\\dell\\OneDrive\\Desktop\\edit sofa";

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📸 INDIVIDUAL PRODUCT UPLOAD - EACH PHOTO = 1 PRODUCT`);
  console.log(`${'='.repeat(80)}\n`);
  console.log(`📁 Source: ${inputFolder}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected\n");

    // 🗑️ DELETE ALL OLD PRODUCTS COMPLETELY
    console.log("🗑️  Deleting all old products...");
    await Product.deleteMany({});
    await Product.collection.dropIndexes(); // Drop all indexes
    console.log(`✓ Deleted all products and cleared indexes\n`);

    const files = fs.readdirSync(inputFolder).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    });

    console.log(`📊 Found ${files.length} image files`);
    console.log(`📦 Creating ${files.length} INDIVIDUAL products\n`);
    console.log(`${'─'.repeat(80)}\n`);

    // Create categories
    const categoryIds = {};
    const uniqueCategories = [...new Set(files.map(f => extractCategory(f)))];
    
    for (const catSlug of uniqueCategories) {
      const catName = catSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      let cat = await Category.findOne({ slug: catSlug });
      if (!cat) {
        cat = await Category.create({ name: catName, slug: catSlug });
      }
      categoryIds[catSlug] = cat._id;
    }

    const products = [];
    let totalUploaded = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(inputFolder, file);
      const productName = cleanProductName(file);
      const category = extractCategory(file);

      console.log(`[${i + 1}/${files.length}] ${productName}`);
      process.stdout.write(`  Uploading to Cloudinary... `);

      try {
        const result = await uploadWithRetry(filePath, category);

        if (result) {
          const slug = slugify(`${productName}-${i + 1}`, { lower: true, strict: true });
          
          const product = {
            name: productName,
            slug: slug,
            sku: `SHS-${category.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
            category: categoryIds[category],
            subCategory: `${category.charAt(0).toUpperCase() + category.slice(1)} Collection`,
            price: 24999,
            marketPrice: 39999,
            stock: 5,
            description: generateDescription(productName, category),
            shortDescription: generateShortDescription(productName, category),
            material: "Premium Materials with Solid Wood Frame",
            warranty: "10 Year Frame Warranty",
            images: [{
              url: result.secure_url,
              alt: productName,
            }],
            isFeatured: false,
            isBestSeller: false,
            isNewLaunch: true,
            fabricOptions: ["Natural Brown", "Charcoal Black", "Cream White"],
            metaTitle: generateSeoTitle(productName),
            metaDescription: generateSeoDescription(productName, category),
            metaKeywords: [
              productName.toLowerCase(),
              category,
              "buy online",
              "sofa hi sofa",
              "furniture",
              "free delivery",
              "warranty",
            ],
          };

          products.push(product);
          totalUploaded++;
          console.log("✓");
        }

        await delay(500); // Slower to avoid rate limits
      } catch (err) {
        console.log(`✗ SKIP - ${err.message.substring(0, 40)}`);
      }
    }

    console.log(`\n${'─'.repeat(80)}\n`);
    console.log(`💾 Saving ${products.length} individual products to database...\n`);

    const createdProducts = await Product.insertMany(products);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ SUCCESS! ALL INDIVIDUAL PRODUCTS CREATED\n`);
    console.log(`📊 Summary:`);
    console.log(`   • Total images uploaded: ${totalUploaded}`);
    console.log(`   • Individual products created: ${createdProducts.length}`);
    console.log(`   • Each product has 1 unique photo\n`);
    console.log(`🎉 All products are NOW LIVE!\n`);
    console.log(`📱 View them at: http://localhost:5173\n`);
    console.log(`🎛️  Admin Panel: http://localhost:5173/admin/products\n`);
    console.log(`${'='.repeat(80)}\n`);

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
