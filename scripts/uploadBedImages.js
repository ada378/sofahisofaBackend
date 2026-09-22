import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cloudinary } from "../config/cloudinary.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bed images folder path
const BED_IMAGES_FOLDER = "C:\\Users\\dell\\Downloads\\luxury bed lucknow (1)";

// Function to extract base name (without numbers/variations)
function getBaseName(filename) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  
  // Remove trailing numbers like -1, -2, (1), (2), _1, _2
  const baseName = nameWithoutExt
    .replace(/[-_\s]*\(\d+\)$/i, "") // Remove (1), (2)
    .replace(/[-_\s]*\d+$/i, "")      // Remove -1, -2, _1, _2
    .trim();
  
  return baseName;
}

// Function to group similar images
function groupSimilarImages(files) {
  const groups = {};
  
  files.forEach(file => {
    const baseName = getBaseName(file);
    if (!groups[baseName]) {
      groups[baseName] = [];
    }
    groups[baseName].push(file);
  });
  
  return groups;
}

// Function to generate product name from filename
function generateProductName(baseName) {
  return baseName
    .replace(/[-_]/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Function to upload image to Cloudinary
async function uploadToCloudinary(imagePath, folderName = "beds") {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: `sofa-hi-sofa/${folderName}`,
      resource_type: "image",
      transformation: [
        { width: 1200, height: 900, crop: "fill", gravity: "auto", quality: "auto:good" }
      ]
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error(`Error uploading ${imagePath}:`, error.message);
    return null;
  }
}

// Function to create product slug
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Main upload function
async function uploadBedProducts() {
  try {
    console.log("🛏️  Starting Bed Products Upload...\n");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected\n");
    
    // Get or create Bed category
    let bedCategory = await Category.findOne({ slug: "bed" });
    if (!bedCategory) {
      bedCategory = await Category.create({
        name: "Bed",
        slug: "bed",
        description: "Premium solid wood beds with luxury upholstery"
      });
      console.log("✅ Bed category created\n");
    }
    
    // Read all image files
    const allFiles = fs.readdirSync(BED_IMAGES_FOLDER)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    
    console.log(`📂 Found ${allFiles.length} image files\n`);
    
    // Group similar images
    const imageGroups = groupSimilarImages(allFiles);
    const productCount = Object.keys(imageGroups).length;
    
    console.log(`🔄 Grouped into ${productCount} products\n`);
    
    let uploadedCount = 0;
    let skippedCount = 0;
    
    // Process each product group
    for (const [baseName, imageFiles] of Object.entries(imageGroups)) {
      const productName = generateProductName(baseName);
      const slug = createSlug(productName);
      
      console.log(`\n📦 Processing: ${productName}`);
      console.log(`   Images: ${imageFiles.length} (${imageFiles.join(", ")})`);
      
      // Check if product already exists
      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        console.log(`   ⚠️  Already exists - Skipping`);
        skippedCount++;
        continue;
      }
      
      // Upload all images for this product
      const uploadedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const imagePath = path.join(BED_IMAGES_FOLDER, imageFile);
        
        console.log(`   📤 Uploading ${i + 1}/${imageFiles.length}: ${imageFile}...`);
        
        const uploaded = await uploadToCloudinary(imagePath, "beds");
        if (uploaded) {
          uploadedImages.push(uploaded);
          console.log(`      ✅ Uploaded`);
        } else {
          console.log(`      ❌ Failed`);
        }
      }
      
      if (uploadedImages.length === 0) {
        console.log(`   ❌ No images uploaded - Skipping product`);
        skippedCount++;
        continue;
      }
      
      // Create product with multiple images
      const sku = `BED-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const newProduct = await Product.create({
        name: productName,
        slug,
        sku,
        description: `Premium ${productName} - Handcrafted solid wood construction with luxury upholstery. Available in custom sizes and fabrics.`,
        category: bedCategory._id,
        subCategory: "Luxury Bed",
        
        // Store all images
        images: uploadedImages.map((img, idx) => ({
          url: img.url,
          alt: `${productName} - View ${idx + 1}`
        })),
        
        // Default pricing
        price: 45000 + (Math.floor(Math.random() * 5) * 5000), // ₹45k-70k range
        marketPrice: 65000 + (Math.floor(Math.random() * 5) * 5000),
        
        // Bed specifics
        material: "Sheesham Wood",
        dimensions: {
          width: 180, // King size default
          height: 120,
          depth: 210,
          unit: "cm"
        },
        
        // Fabric options (strings only)
        fabricOptions: [
          "Charcoal Velvet",
          "Cream Linen",
          "Navy Blue Velvet",
          "Beige Bouclé"
        ],
        
        stock: 5,
        isBestSeller: Math.random() > 0.7,
        rating: 4.5 + (Math.random() * 0.5),
        numReviews: Math.floor(Math.random() * 50) + 10,
        warranty: "10 Years on Frame",
        
        // SEO
        metaTitle: `${productName} | Buy Online | Sofa Hi Sofa`,
        metaDescription: `Premium ${productName} with solid wood frame. Free delivery & installation. 10-year warranty.`
      });
      
      console.log(`   ✅ Product created with ${uploadedImages.length} images`);
      console.log(`   🔗 Slug: ${slug}`);
      uploadedCount++;
    }
    
    console.log("\n\n🎉 Upload Complete!\n");
    console.log(`📊 Summary:`);
    console.log(`   ✅ Uploaded: ${uploadedCount} products`);
    console.log(`   ⚠️  Skipped: ${skippedCount} products (already exist)`);
    console.log(`   📁 Total: ${productCount} products processed\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run script
uploadBedProducts();
