import dotenv from "dotenv";
import mongoose from "mongoose";
import slugify from "slugify";

dotenv.config();

import Category from "../models/Category.js";
import Product from "../models/Product.js";

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI);

const productsData = [
  {
    name: "Chair Furniture Collection",
    category: "chair",
    imageCount: 18,
    price: 29999,
    marketPrice: 49999,
  },
  {
    name: "Premium Chair Collection",
    category: "chair",
    imageCount: 6,
    price: 24999,
    marketPrice: 39999,
  },
  {
    name: "Dining Set with Chair",
    category: "dining-table",
    imageCount: 7,
    price: 34999,
    marketPrice: 54999,
  },
  {
    name: "Dining Table Marble Collection",
    category: "dining-table",
    imageCount: 39,
    price: 44999,
    marketPrice: 74999,
  },
  {
    name: "Luxury Beds Collection",
    category: "bed",
    imageCount: 8,
    price: 34999,
    marketPrice: 58999,
  },
  {
    name: "Luxury Sofa Collection",
    category: "sofa",
    imageCount: 10,
    price: 38999,
    marketPrice: 64999,
  },
  {
    name: "Table Collection",
    category: "dining-table",
    imageCount: 2,
    price: 14999,
    marketPrice: 24999,
  },
];

async function createProducts() {
  console.log("\n🔗 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected\n");

  console.log("🏷️ Creating categories...\n");
  
  const categoryIds = {};
  const categories = ["chair", "sofa", "bed", "dining-table"];
  
  for (const catSlug of categories) {
    const catName = catSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    let cat = await Category.findOne({ slug: catSlug });
    if (!cat) {
      cat = await Category.create({ name: catName, slug: catSlug });
      console.log(`  ✓ Created: ${catName}`);
    } else {
      console.log(`  ✓ Found: ${catName}`);
    }
    categoryIds[catSlug] = cat._id;
  }

  console.log("\n💾 Creating products...\n");

  let index = 1;
  for (const productData of productsData) {
    const slug = slugify(`${productData.name}-${index}`, { lower: true, strict: true });
    
    // Check if already exists
    const existing = await Product.findOne({ slug });
    if (existing) {
      console.log(`  ⚠️ Skipped: ${productData.name} (already exists)`);
      index++;
      continue;
    }

    const product = {
      name: productData.name,
      slug: slug,
      sku: `SHS-${productData.category.toUpperCase()}-${String(index).padStart(3, "0")}`,
      category: categoryIds[productData.category],
      subCategory: `${productData.category.charAt(0).toUpperCase() + productData.category.slice(1)} Collection`,
      price: productData.price,
      marketPrice: productData.marketPrice,
      stock: 10,
      description: `Premium handcrafted ${productData.name} featuring expert craftsmanship and high-quality materials. Built with solid wood frame and designed for comfort, durability, and style. Comes with 10-year frame warranty and free delivery across India.`,
      shortDescription: `Premium ${productData.name} with quality craftsmanship`,
      material: "Premium Materials with Solid Wood Frame",
      warranty: "10 Year Frame Warranty",
      images: Array.from({ length: Math.min(productData.imageCount, 5) }, (_, i) => ({
        url: `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80`,
        alt: `${productData.name} - View ${i + 1}`,
      })),
      isFeatured: true,
      isBestSeller: productData.imageCount > 10,
      isNewLaunch: true,
      fabricOptions: ["Natural Brown", "Charcoal Black", "Cream White"],
      metaTitle: `${productData.name} | Buy Online | Sofa Hi Sofa`,
      metaDescription: `Buy premium ${productData.name} online. Solid wood frame, 10-year warranty, free delivery. Direct from factory.`,
      metaKeywords: [
        productData.name.toLowerCase(),
        productData.category,
        "buy online",
        "sofa hi sofa",
        "free delivery",
        "warranty",
      ],
    };

    await Product.create(product);
    console.log(`  ✓ Created: ${productData.name}`);
    index++;
  }

  console.log("\n✅ SUCCESS! All products created!\n");
  console.log(`📊 Total: ${productsData.length} products\n`);
  console.log("🎉 Go to http://localhost:5173 to see them!\n");

  await mongoose.disconnect();
  process.exit(0);
}

createProducts().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
