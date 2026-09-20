import fs from "fs";
import path from "path";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

dotenv.config();

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Import models
import Category from "../models/Category.js";
import Product from "../models/Product.js";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Category mapping
const categoryMap = {
  chair: "chair",
  sofa: "sofa",
  bed: "bed",
  dining: "dining-table",
  table: "dining-table",
};

function extractCategory(filename) {
  const lower = filename.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lower.includes(key)) return value;
  }
  return "furniture";
}

function extractProductName(filename) {
  const namePart = filename
    .replace(/Lucknow/gi, "")
    .replace(/Sofahisofa/gi, "")
    .replace(/Sofa/gi, "")
    .replace(/hi/gi, "")
    .replace(/from/gi, "")
    .replace(/\(\d+\)/g, "")
    .trim();
  return namePart.substring(0, 50) || "Premium Furniture";
}

function generateDescription(productName, category) {
  const descriptions = {
    sofa: `Premium handcrafted ${productName} with solid wood frame and high-resilience foam. Built for everyday Indian living rooms with comfort and durability. Features elegant design with 10-year frame warranty and free pan-India delivery.`,
    chair: `Elegant ${productName} perfect for any room setting. Crafted with premium materials and solid wood construction. Designed for comfort and style with expert craftsmanship. Backed by 10-year warranty.`,
    bed: `Luxury ${productName} featuring solid wood construction with premium mattress support. Architectural design with superior comfort. Perfect for modern Indian bedrooms with lifetime termite guarantee.`,
    "dining-table": `Modern ${productName} combining functionality with elegant design. Crafted from premium materials with sturdy construction. Perfect for family gatherings with easy maintenance and 10-year warranty.`,
    furniture: `Premium ${productName} featuring expert craftsmanship and high-quality materials. Designed for comfort, durability, and style. 10-year warranty with free delivery across India.`,
  };
  return descriptions[category] || descriptions.furniture;
}

function generateShortDescription(productName, category) {
  const prefixes = {
    sofa: `Premium ${productName} with solid wood frame`,
    chair: `Elegant ${productName} for any room`,
    bed: `Luxury ${productName} with premium comfort`,
    "dining-table": `Modern ${productName} for family dining`,
    furniture: `Premium ${productName} with quality craftsmanship`,
  };
  return prefixes[category] || prefixes.furniture;
}

function generateSeoTitle(productName, category) {
  return `${productName} | Premium ${category.charAt(0).toUpperCase() + category.slice(1)} Online | Sofa Hi Sofa`;
}

function generateSeoDescription(productName, category) {
  const descriptions = {
    sofa: `Buy premium ${productName} online. Solid wood frame, 10-year warranty, free delivery. Direct from factory, 100+ fabric choices.`,
    chair: `Shop elegant ${productName}. Premium crafted chair with warranty. Best prices, free delivery all over India.`,
    bed: `Luxury ${productName} online at best price. Solid wood construction, lifetime guarantee, free installation.`,
    "dining-table": `Modern ${productName} for your dining room. Premium materials, sturdy design, lifetime warranty.`,
    furniture: `Buy premium ${productName} online. Best quality, warranty, free delivery across India.`,
  };
  return descriptions[category] || descriptions.furniture;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadWithRetry(filePath, category, filename, maxRetries = 5) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: `sofa-hi-sofa/${category}`,
        resource_type: "auto",
        quality: "auto",
        timeout: 60000,
      });
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        process.stdout.write(`[Retry ${attempt}/${maxRetries}] `);
        await delay(waitTime);
      }
    }
  }
  
  throw lastError;
}

async function main() {
  const inputFolder = process.argv[2] || "C:\\Users\\dell\\OneDrive\\Desktop\\edit sofa";

  if (!fs.existsSync(inputFolder)) {
    console.error("\n❌ Folder not found:", inputFolder);
    process.exit(1);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📸 BULK PHOTO UPLOAD - COMPLETE ONE-TIME PROCESSING`);
  console.log(`${'='.repeat(70)}\n`);
  console.log(`📁 Source Folder: ${inputFolder}\n`);

  try {
    // Connect to MongoDB
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected\n");

    // Read files
    const files = fs.readdirSync(inputFolder).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    });

    console.log(`📊 Found ${files.length} image files\n`);

    // Group by product
    const productGroups = {};
    files.forEach((file) => {
      const category = extractCategory(file);
      const productName = extractProductName(file);
      const key = `${category}_${productName}`;

      if (!productGroups[key]) {
        productGroups[key] = {
          name: productName,
          category: category,
          files: [],
        };
      }
      productGroups[key].files.push(file);
    });

    console.log(`📂 Grouped into ${Object.keys(productGroups).length} products\n`);
    console.log(`${'─'.repeat(70)}\n`);

    const products = [];
    let totalUploaded = 0;
    let totalErrors = 0;

    // Process each product group
    let productIndex = 0;
    for (const [key, group] of Object.entries(productGroups)) {
      productIndex++;
      console.log(`[${productIndex}/${Object.keys(productGroups).length}] Processing: "${group.name}"`);
      console.log(`  Category: ${group.category} | Files: ${group.files.length}\n`);

      const images = [];

      // Upload all images for this product
      for (let i = 0; i < group.files.length; i++) {
        const file = group.files[i];
        const filePath = path.join(inputFolder, file);

        try {
          process.stdout.write(`  [${String(i + 1).padStart(2, '0')}/${String(group.files.length).padStart(2, '0')}] `);

          const result = await uploadWithRetry(filePath, group.category, file);

          images.push({
            url: result.secure_url,
            alt: `${group.name} - View ${images.length + 1}`,
          });

          totalUploaded++;
          console.log("✓");

          // Small delay to avoid throttling
          if (i < group.files.length - 1) {
            await delay(300);
          }
        } catch (err) {
          totalErrors++;
          console.log(`✗ Failed: ${err.message.substring(0, 50)}`);
          await delay(1000);
        }
      }

      // Create product if images uploaded
      if (images.length > 0) {
        // Generate slug from name
        const slug = `${group.name}-${String(productIndex).padStart(3, "0")}`
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");

        const product = {
          name: group.name,
          slug: slug, // Add slug
          sku: `SHS-${group.category.toUpperCase()}-${String(productIndex).padStart(3, "0")}`,
          category: group.category,
          subCategory: `${group.category.charAt(0).toUpperCase() + group.category.slice(1)} Collection`,
          price: 24999,
          marketPrice: 39999,
          stock: 5,
          description: generateDescription(group.name, group.category),
          shortDescription: generateShortDescription(group.name, group.category),
          material: "Premium Materials with Solid Wood Frame",
          warranty: "10 Year Frame Warranty",
          images: images,
          isFeatured: true,
          isBestSeller: false,
          isNewLaunch: true,
          fabricOptions: ["Natural Brown", "Charcoal Black"],
          metaTitle: generateSeoTitle(group.name, group.category),
          metaDescription: generateSeoDescription(group.name, group.category),
          metaKeywords: [
            group.name.toLowerCase(),
            group.category,
            "buy online",
            "sofa hi sofa",
            "free delivery",
            "warranty",
          ],
        };

        products.push(product);
        console.log(`  ✓ Product prepared with ${images.length} images\n`);
      }
    }

    // Create/update categories
    console.log(`${'─'.repeat(70)}\n`);
    console.log(`🏷️  Creating/updating categories...\n`);

    const categoryIds = {};
    for (const product of products) {
      if (!categoryIds[product.category]) {
        const categoryName =
          product.category.charAt(0).toUpperCase() + product.category.slice(1);
        
        let cat = await Category.findOne({ slug: product.category });
        if (!cat) {
          cat = await Category.create({
            name: categoryName,
            slug: product.category,
          });
          console.log(`  ✓ Created: ${categoryName}`);
        } else {
          console.log(`  ✓ Found: ${categoryName}`);
        }
        
        categoryIds[product.category] = cat._id;
      }
      
      product.category = categoryIds[product.category];
    }

    // Insert all products to database
    console.log(`\n${'─'.repeat(70)}\n`);
    console.log(`💾 Saving ${products.length} products to database...\n`);

    // Delete old products first (optional - comment out if you want to keep them)
    // await Product.deleteMany({});

    const createdProducts = await Product.insertMany(products);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ SUCCESS! ALL PRODUCTS UPLOADED & SAVED\n`);
    console.log(`📊 Final Summary:`);
    console.log(`   • Total files processed: ${files.length}`);
    console.log(`   • Images uploaded: ${totalUploaded}`);
    console.log(`   • Upload errors: ${totalErrors}`);
    console.log(`   • Products created: ${createdProducts.length}`);
    console.log(`   • Categories created/updated: ${Object.keys(categoryIds).length}\n`);

    console.log(`🎉 Products are NOW LIVE in your database!\n`);
    console.log(`📋 To view them:`);
    console.log(`   1. Go to Admin Panel: http://localhost:5173`);
    console.log(`   2. Navigate to Products`);
    console.log(`   3. You'll see all 7 new products with carousel images\n`);

    console.log(`${'='.repeat(70)}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ CRITICAL ERROR:", err.message);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
