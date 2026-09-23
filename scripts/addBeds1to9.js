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

const BED_FOLDER = 'C:\\Users\\dell\\Downloads\\luxury bed lucknow furniter (1)';

async function uploadToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'sofa-hi-sofa/beds',
      transformation: [{ width: 1200, height: 1200, crop: 'pad', background: 'white', quality: 'auto:good' }]
    });
    console.log(`   ✅ Uploaded: ${path.basename(imagePath)}`);
    return { url: result.secure_url };
  } catch (error) {
    console.error(`   ❌ Failed to upload ${path.basename(imagePath)}:`, error.message);
    return null;
  }
}

function createSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function addBeds1to9() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let bedCategory = await Category.findOne({ slug: 'bed' });
    
    if (!bedCategory) {
      bedCategory = await Category.create({
        name: 'Bed',
        slug: 'bed',
        description: 'Luxury beds and bedroom furniture',
        order: 1
      });
      console.log('✅ Created Bed category');
    } else {
      console.log(`✅ Found category: ${bedCategory.name}`);
    }

    // Delete existing bed products first
    const existing = await Product.deleteMany({ category: bedCategory._id });
    console.log(`✅ Deleted ${existing.deletedCount} existing bed products\n`);

    const allFiles = fs.readdirSync(BED_FOLDER)
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
        const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`📁 Found ${allFiles.length} images`);

    // Group first 36 images into 9 products (4 images each)
    const totalImages = Math.min(36, allFiles.length);
    const groups = [];
    
    for (let i = 0; i < 9; i++) {
      const startIdx = i * 4;
      const groupImages = [];
      
      for (let j = 0; j < 4 && startIdx + j < totalImages; j++) {
        groupImages.push(startIdx + j);
      }
      
      if (groupImages.length > 0) {
        groups.push({
          images: groupImages,
          name: `Premium Bed ${i + 1}`
        });
      }
    }

    console.log(`🛏️ Creating ${groups.length} Bed products (1-9)...\n`);

    let productsCreated = 0;

    for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
      const group = groups[groupIdx];
      const productNum = groupIdx + 1;
      const productName = group.name;
      const productSlug = createSlug(productName);

      console.log(`[${productNum}/9] ${productName}`);

      const productImages = [];

      for (let imgIdx of group.images) {
        const imageFile = allFiles[imgIdx];
        const imagePath = path.join(BED_FOLDER, imageFile);
        
        const uploaded = await uploadToCloudinary(imagePath);
        
        if (uploaded) {
          productImages.push({
            url: uploaded.url,
            alt: `${productName} - View ${productImages.length + 1}`,
            isPrimary: productImages.length === 0
          });
        }
      }

      if (productImages.length === 0) {
        console.log(`   ⚠️ No images uploaded, skipping...`);
        continue;
      }

      const basePrice = 95000 + (productNum * 8000);
      const marketPrice = basePrice + 25000;
      const productSku = `BEDX-${productNum.toString().padStart(3, '0')}`;

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: bedCategory._id,
        subCategory: 'Luxury Bed',
        images: productImages,
        price: basePrice,
        marketPrice: marketPrice,
        description: `Exquisite ${productName} with solid sheesham wood frame and premium craftsmanship. Perfect for luxury bedrooms. 15-year warranty.`,
        shortDescription: `Premium ${productName} with solid wood frame and designer upholstery.`,
        dimensions: {
          width: 180,
          height: 120,
          depth: 210,
          unit: 'cm'
        },
        material: 'Solid Sheesham Wood + High-Density Foam + Premium Upholstery',
        bedSize: 'Queen (180 x 210 cm)',
        stock: 12,
        isFeatured: productNum <= 2,
        isBestSeller: productNum <= 3,
        rating: 4.6 + (Math.random() * 0.4),
        numReviews: Math.floor(Math.random() * 80) + 30,
        warranty: '15 Years',
        metaTitle: `${productName} | Buy Online | Sofa Hi Sofa`,
        metaDescription: `Premium ${productName} with solid sheesham wood. Direct from factory, best prices.`
      };

      const product = new Product(productData);
      await product.save();

      console.log(`   ✅ Created with ${productImages.length} images\n`);
      productsCreated++;
    }

    console.log(`✅ Successfully created ${productsCreated} Bed products (1-9)!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB closed');
  }
}

addBeds1to9();