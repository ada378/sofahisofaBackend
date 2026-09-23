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

const MIRROR_FOLDER = 'C:\\Users\\dell\\Downloads\\luxury mirror (9)';

async function uploadToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'sofa-hi-sofa/mirrors',
      transformation: [{ width: 1000, height: 1500, crop: 'pad', background: 'white', quality: 'auto:good' }]
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

async function uploadMirrors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let mirrorCategory = await Category.findOne({ slug: 'mirror' });
    
    if (!mirrorCategory) {
      mirrorCategory = await Category.create({
        name: 'Mirror',
        slug: 'mirror',
        description: 'Luxury mirrors and wall décor',
        order: 1
      });
      console.log('✅ Created Mirror category');
    } else {
      console.log(`✅ Found category: ${mirrorCategory.name}`);
    }

    const allFiles = fs.readdirSync(MIRROR_FOLDER)
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
        const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`\n📁 Found ${allFiles.length} images`);
    console.log(`🪞 Creating ${allFiles.length} Mirror products (individual)...\n`);

    let productsCreated = 0;

    for (let productNum = 0; productNum < allFiles.length; productNum++) {
      const imageFile = allFiles[productNum];
      const imagePath = path.join(MIRROR_FOLDER, imageFile);
      const productName = `Luxury Mirror ${productNum + 1}`;
      const productSlug = createSlug(productName);

      console.log(`[${productNum + 1}/${allFiles.length}] ${productName}`);

      const uploaded = await uploadToCloudinary(imagePath);
      
      if (!uploaded) {
        console.log(`   ⚠️ Upload failed, skipping...\n`);
        continue;
      }

      const productImages = [{
        url: uploaded.url,
        alt: productName,
        isPrimary: true
      }];

      const basePrice = 8000 + (productNum * 2000);
      const marketPrice = basePrice + 3000;
      let productSku = `MIRROR-${(productNum + 1).toString().padStart(3, '0')}`;
      
      // Check if SKU already exists
      let existingSku = await Product.findOne({ sku: productSku });
      let counter = 1;
      while (existingSku) {
        productSku = `MIRROR-${(productNum + 1).toString().padStart(3, '0')}-V${counter}`;
        existingSku = await Product.findOne({ sku: productSku });
        counter++;
      }

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: mirrorCategory._id,
        subCategory: 'Wall Mirror',
        images: productImages,
        price: basePrice,
        marketPrice: marketPrice,
        description: `Elegant ${productName} with premium frame and high-quality reflective glass. Perfect for modern homes and offices. 5-year warranty.`,
        shortDescription: `Premium ${productName} with designer frame.`,
        dimensions: {
          width: 80,
          height: 120,
          depth: 5,
          unit: 'cm'
        },
        material: 'Glass + Wooden/Metal Frame',
        mirrorType: 'Wall Mirror',
        stock: 20,
        isFeatured: productNum === 0,
        isBestSeller: productNum <= 1,
        rating: 4.4 + (Math.random() * 0.6),
        numReviews: Math.floor(Math.random() * 40) + 15,
        warranty: '5 Years',
        metaTitle: `${productName} | Buy Online | Sofa Hi Sofa`,
        metaDescription: `Premium ${productName} with designer frame. Direct from factory.`
      };

      const product = new Product(productData);
      await product.save();

      console.log(`   ✅ Created\n`);
      productsCreated++;
    }

    console.log(`✅ Successfully created ${productsCreated} Mirror products!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB closed');
  }
}

uploadMirrors();
