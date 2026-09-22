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

// Sofa images folder path
const SOFA_FOLDER = 'C:\\Users\\dell\\Downloads\\luxury Sofa from Lucknow Sofahosofa   (1)';

// Function to upload image to Cloudinary directly
async function uploadToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'sofa-hi-sofa/sofas',
      transformation: [{ width: 1200, height: 900, crop: 'fill', quality: 'auto:good' }]
    });
    console.log(`   ✅ Uploaded: ${path.basename(imagePath)}`);
    return { url: result.secure_url };
  } catch (error) {
    console.error(`   ❌ Failed to upload ${path.basename(imagePath)}:`, error.message);
    return null;
  }
}

// Function to create slug
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uploadSofas() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get Sofa category
    const sofaCategory = await Category.findOne({ slug: 'sofa' });
    if (!sofaCategory) {
      console.error('❌ Sofa category not found in database');
      process.exit(1);
    }
    console.log(`✅ Found category: ${sofaCategory.name} (ID: ${sofaCategory._id})`);

    // Get all image files from folder
    const allFiles = fs.readdirSync(SOFA_FOLDER)
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
        const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`\n📁 Found ${allFiles.length} images in folder`);

    // Group images: max 4 per product
    const MAX_IMAGES_PER_PRODUCT = 4;
    const totalProducts = Math.ceil(allFiles.length / MAX_IMAGES_PER_PRODUCT);
    
    console.log(`\n🛋️  Creating ${totalProducts} Luxury Sofa products...\n`);

    let imageIndex = 0;
    let productsCreated = 0;

    for (let productNum = 1; productNum <= totalProducts; productNum++) {
      const productName = `Luxury Sofa ${productNum}`;
      const productSlug = createSlug(productName);

      console.log(`\n[${productNum}/${totalProducts}] Creating: ${productName}`);

      // Take next 4 images (or remaining)
      const productImages = [];
      const imagesToUpload = allFiles.slice(imageIndex, imageIndex + MAX_IMAGES_PER_PRODUCT);
      
      console.log(`   📸 Uploading ${imagesToUpload.length} images...`);

      for (let i = 0; i < imagesToUpload.length; i++) {
        const imageFile = imagesToUpload[i];
        const imagePath = path.join(SOFA_FOLDER, imageFile);
        
        const uploaded = await uploadToCloudinary(imagePath);
        
        if (uploaded) {
          productImages.push({
            url: uploaded.url,
            alt: `${productName} - View ${i + 1}`,
            isPrimary: i === 0
          });
        }
      }

      imageIndex += imagesToUpload.length;

      if (productImages.length === 0) {
        console.log(`   ⚠️  No images uploaded for ${productName}, skipping...`);
        continue;
      }

      // Create product
      const basePrice = 65000 + (productNum * 5000);
      const salePrice = Math.floor(basePrice * 0.85);
      const productSku = `SOFA-${productNum.toString().padStart(3, '0')}`;

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: sofaCategory._id,
        images: productImages,
        price: basePrice,
        marketPrice: basePrice + 15000,
        description: `Experience ultimate comfort with ${productName}. Handcrafted with solid sheesham wood frame, premium high-density foam cushioning, and luxurious designer fabric upholstery. Features elegant design with 10-year frame warranty and superior craftsmanship. Perfect for modern Indian living rooms.`,
        shortDescription: `Premium ${productName} with solid wood frame, designer fabric upholstery, and 10-year warranty. Direct from factory.`,
        dimensions: {
          width: 220,
          height: 85,
          depth: 90,
          unit: 'cm'
        },
        material: 'Solid Sheesham Wood Frame, High-Density Foam, Premium Fabric',
        fabricOptions: ['Charcoal Grey', 'Cream Beige', 'Navy Blue', 'Burgundy Red'],
        stock: 15,
        isFeatured: productNum <= 3,
        isBestSeller: productNum <= 5,
        rating: 4.5 + (Math.random() * 0.5),
        numReviews: Math.floor(Math.random() * 50) + 20,
        warranty: '10 Years',
        metaTitle: `${productName} | Buy Online | Sofa Hi Sofa`,
        metaDescription: `Buy premium ${productName} online. Solid wood frame, 10-year warranty, designer fabrics. Direct from factory, best prices.`
      };

      const product = new Product(productData);
      await product.save();

      console.log(`   ✅ Product created with ${productImages.length} images`);
      productsCreated++;
    }

    console.log(`\n✅ Successfully created ${productsCreated} Luxury Sofa products!`);
    console.log(`📊 Total images uploaded: ${imageIndex}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

uploadSofas();
