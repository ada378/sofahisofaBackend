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

// Center table images folder path
const CENTER_TABLE_FOLDER = 'C:\\Users\\dell\\Downloads\\center  table lucknow  (5)';

// Function to upload image to Cloudinary directly with proper fit
async function uploadToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'sofa-hi-sofa/center-tables',
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
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uploadCenterTables() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create Center Table category
    let centerTableCategory = await Category.findOne({ slug: 'center-table' });
    
    if (!centerTableCategory) {
      centerTableCategory = await Category.create({
        name: 'Center Table',
        slug: 'center-table',
        description: 'Luxury center tables for living rooms',
        order: 7
      });
      console.log('✅ Created Center Table category');
    } else {
      console.log(`✅ Found category: ${centerTableCategory.name} (ID: ${centerTableCategory._id})`);
    }

    // Get all image files from folder
    const allFiles = fs.readdirSync(CENTER_TABLE_FOLDER)
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
        const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`\n📁 Found ${allFiles.length} images in folder`);

    // Grouping strategy: Group similar images based on visual similarity
    // Based on 13 images, typical grouping:
    // Group 1: Different angles of table 1 (usually 3-4 images)
    // Group 2: Different angles of table 2 (3-4 images)
    // Group 3: Different angles of table 3 (3-4 images)
    // etc.
    
    // Manual grouping for 13 images:
    // [1, 2, 3] - Center Table 1 (3 angles)
    // [4, 5, 6] - Center Table 2 (3 angles)
    // [7, 8, 9] - Center Table 3 (3 angles)
    // [10, 11, 12, 13] - Center Table 4 (4 angles)
    
    const groups = [
      { images: [0, 1, 2], name: 'Elegant Marble Center Table' },
      { images: [3, 4, 5], name: 'Contemporary Glass Center Table' },
      { images: [6, 7, 8], name: 'Premium Wood Center Table' },
      { images: [9, 10, 11, 12], name: 'Modern Coffee Center Table' },
    ];

    console.log(`\n📦 Creating ${groups.length} Center Table products with carousel images...\n`);

    let productsCreated = 0;

    for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
      const group = groups[groupIdx];
      const productNum = groupIdx + 1;
      const productName = group.name;
      const productSlug = createSlug(productName);

      console.log(`\n[${productNum}/${groups.length}] Creating: ${productName}`);
      console.log(`   Images: ${group.images.length} photos`);

      const productImages = [];

      for (let imgIdx of group.images) {
        const imageFile = allFiles[imgIdx];
        const imagePath = path.join(CENTER_TABLE_FOLDER, imageFile);
        
        console.log(`   📸 Uploading: ${imageFile}...`);
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
        console.log(`   ⚠️  No images uploaded for ${productName}, skipping...`);
        continue;
      }

      // Create product
      const basePrice = 15000 + (productNum * 5000);
      const marketPrice = basePrice + 5000;
      const productSku = `CTB-${(productNum + 100).toString().padStart(3, '0')}`;

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: centerTableCategory._id,
        subCategory: 'Center Table',
        images: productImages,
        price: basePrice,
        marketPrice: marketPrice,
        description: `Beautiful ${productName} perfect for modern living rooms. Crafted with premium materials and elegant design. This center table combines functionality with aesthetic appeal, making it an ideal choice for contemporary homes.`,
        shortDescription: `Premium ${productName} with elegant design. Perfect for living rooms.`,
        dimensions: {
          width: 90,
          height: 45,
          depth: 60,
          unit: 'cm'
        },
        material: 'Premium Wood + Glass/Metal',
        stock: 20,
        isFeatured: productNum <= 2,
        isBestSeller: productNum === 1,
        rating: 4.4 + (Math.random() * 0.5),
        numReviews: Math.floor(Math.random() * 40) + 15,
        warranty: '2 Years',
        metaTitle: `${productName} | Buy Online | Sofa Hi Sofa`,
        metaDescription: `Buy premium ${productName} online. Elegant design, premium materials. Direct from factory, best prices.`
      };

      const product = new Product(productData);
      await product.save();

      console.log(`   ✅ Product created with ${productImages.length} carousel images`);
      productsCreated++;
    }

    console.log(`\n✅ Successfully created ${productsCreated} Center Table products!`);
    console.log(`📸 Total images: ${allFiles.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

uploadCenterTables();
