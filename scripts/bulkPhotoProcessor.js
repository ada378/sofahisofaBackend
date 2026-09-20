import fs from "fs";
import path from "path";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

dotenv.config();

const dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(dirname, "..");

// Import models - using absolute paths
import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI);

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

async function uploadWithRetry(filePath, category, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: `sofa-hi-sofa/${category}`,
        resource_type: "auto",
        quality: "auto",
      });
      return result;
    } catch (err) {
      console.log(`  Attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        const waitTime = 2000 * attempt;
        console.log(`  Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
      } else {
        throw err;
      }
    }
  }
}

async function processFolderAndCreateJSON() {
  const inputFolder = process.argv[2] || "C:\\Users\\dell\\OneDrive\\Desktop\\edit sofa";

  if (!fs.existsSync(inputFolder)) {
    console.error("❌ Folder not found:", inputFolder);
    process.exit(1);
  }

  console.log(`\n📸 BULK PHOTO UPLOAD - Starting...\n`);
  console.log(`📁 Folder: ${inputFolder}`);

  try {
    const files = fs.readdirSync(inputFolder).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    });

    console.log(`📊 Found ${files.length} image files\n`);

    // Group by product name
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

    const products = [];
    let uploadedCount = 0;
    let processedProducts = 0;
    let errorCount = 0;

    for (const [key, group] of Object.entries(productGroups)) {
      console.log(`⏳ Processing: "${group.name}" (${group.files.length} images)...`);

      const images = [];

      for (let i = 0; i < group.files.length; i++) {
        const file = group.files[i];
        const filePath = path.join(inputFolder, file);

        try {
          process.stdout.write(`  [${i + 1}/${group.files.length}] Uploading ${file.substring(0, 40)}... `);

          const result = await uploadWithRetry(filePath, group.category);

          images.push({
            url: result.secure_url,
            alt: `${group.name} - View ${images.length + 1}`,
          });

          uploadedCount++;
          console.log("✓");

          // Delay between uploads
          if (i < group.files.length - 1) {
            await delay(500);
          }
        } catch (err) {
          errorCount++;
          console.log(`✗ Failed: ${err.message}`);
        }
      }

      // Create product entry
      if (images.length > 0) {
        const product = {
          name: group.name,
          sku: `SHS-${group.category.toUpperCase()}-${String(processedProducts + 1).padStart(3, "0")}`,
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
          fabricOptions: [
            "Natural Brown",\n                "Charcoal Black",
          ],
          metaTitle: generateSeoTitle(group.name, group.category),
          metaDescription: generateSeoDescription(group.name, group.category),
          metaKeywords: [
            group.name,
            group.category,
            "buy online",
            "sofa hi sofa",
            "free delivery",
            "warranty",
          ],
        };

        products.push(product);
        processedProducts++;
        console.log(`  ✓ Product created: ${group.name}\n`);
      }
    }

    // Create or update categories
    console.log(`🏷️  Creating/updating categories...\n`);
    for (const product of products) {
      const categoryName =
        product.category.charAt(0).toUpperCase() + product.category.slice(1);
      let cat = await Category.findOne({ slug: product.category });
      if (!cat) {
        cat = await Category.create({
          name: categoryName,
          slug: product.category,
        });
        console.log(`  ✓ Created category: ${categoryName}`);
      }
      product.category = cat._id;
    }

    // Insert products
    console.log(`\n💾 Saving to database...\n`);
    const createdProducts = await Product.insertMany(products);

    console.log(`\n✅ SUCCESS!\n`);
    console.log(`📊 Final Summary:`);
    console.log(`   • Products created: ${createdProducts.length}`);
    console.log(`   • Images uploaded: ${uploadedCount}`);
    console.log(`   • Upload errors: ${errorCount}`);
    console.log(`   • All products LIVE in database!\n`);

    console.log(`🎉 You can now view them in Admin Panel → Products\n`);

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

// Run
processFolderAndCreateJSON();

