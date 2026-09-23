import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { cloudinary } from '../config/cloudinary.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Watches images folder path
const WATCHES_FOLDER = 'C:\\Users\\dell\\Downloads\\Lucknow Watches Clocks 1 (10)';

// Function to upload image to Cloudinary directly
async function uploadToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'sofa-hi-sofa/watches',
      transformation: [{ width: 1200, height: 1200, crop: 'fill', quality: 'auto:good' }]
    });
    console.log(`   ✅ Uploaded: ${path.basename(imagePath)}`);
    return { url: result.secure_url };
  } catch (error) {
    console.error(`   ❌ Failed to upload ${path.basename(imagePath)}:`, error.message);
    return null;
  }
}

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uploadWatches() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create Watches category
    let watchesCategory = await Category.findOne({ slug: 'watches' });
    
    if (!watchesCategory) {
      watchesCategory = await Category.create({
        name: 'Watches & Clocks',
        slug: 'watches',
        description: 'Luxury wall clocks and decorative watches',
        order: 6
      });
      console.log('✅ Created Watches category');
    } else {
      console.log(`✅ Found category: ${watchesCategory.name} (ID: ${watchesCategory._id})`);
    }

    // Get all image files from folder
    const allFiles = fs.readdirSync(WATCHES_FOLDER)
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
        const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`\n📁 Found ${allFiles.length} images in folder`);

    // Strategy: Har watch ko separate product banayenge
    // Similar looking watches ka grouping manual review ke baad karna better hai
    // For now: Each image = 1 product (user ne kaha agar similar hai tab group karo)
    
    console.log(`\n⌚ Creating individual watch products...\n`);

    let productsCreated = 0;

    for (let i = 0; i < allFiles.length; i++) {
      const imageFile = allFiles[i];
      const productNum = i + 1;
      const productName = `Luxury Wall Clock ${productNum}`;
      const productSlug = createSlug(productName);

      console.log(`\n[${productNum}/${allFiles.length}] Creating: ${productName}`);

      const imagePath = path.join(WATCHES_FOLDER, imageFile);
      
      console.log(`   📸 Uploading image...`);
      const uploaded = await uploadToCloudinary(imagePath);
      
      if (!uploaded) {
        console.log(`   ⚠️  No image uploaded for ${productName}, skipping...`);
        continue;
      }

      const productImages = [{
        url: uploaded.url,
        alt: productName,
        isPrimary: true
      }];

      // Create product
      const basePrice = 8000 + (productNum * 500);
      const marketPrice = basePrice + 2000;
      const productSku = `WATCH-${productNum.toString().padStart(3, '0')}`;

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: watchesCategory._id,
        images: productImages,
        price: basePrice,
        marketPrice: marketPrice,
        description: `Elegant ${productName} featuring premium craftsmanship and timeless design. Perfect for modern homes and offices. Made with high-quality materials and precision movement. Adds a touch of sophistication to any wall.`,
        shortDescription: `Premium ${productName} with elegant design and precision timekeeping. Direct from factory.`,
        dimensions: {
          width: 45,
          height: 45,
          depth: 8,
          unit: 'cm'
        },
        material: 'Metal Frame, Glass Face, Quartz Movement',
        stock: 25,
        isFeatured: productNum <= 3,
        isBestSeller: productNum <= 5,
        rating: 4.3 + (Math.random() * 0.6),
        numReviews: Math.floor(Math.random() * 30) + 10,
        warranty: '1 Year',
        metaTitle: `${productName} | Buy Online | Sofa Hi Sofa`,
        metaDescription: `Buy premium ${productName} online. Elegant design, precision movement, 1-year warranty. Direct from factory, best prices.`
      };

      const product = new Product(productData);
      await product.save();

      console.log(`   ✅ Product created with 1 image`);
      productsCreated++;
    }

    console.log(`\n✅ Successfully created ${productsCreated} Luxury Watch products!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

uploadWatches();
