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

const CHAIR_FOLDER = 'C:\\Users\\dell\\Downloads\\luxury chair lucknow (34)';

async function uploadToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'sofa-hi-sofa/chairs',
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

async function uploadChairs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let chairCategory = await Category.findOne({ slug: 'chair' });
    
    if (!chairCategory) {
      chairCategory = await Category.create({
        name: 'Chair',
        slug: 'chair',
        description: 'Luxury chairs for living rooms and dining',
        order: 5
      });
      console.log('✅ Created Chair category');
    } else {
      console.log(`✅ Found category: ${chairCategory.name} (ID: ${chairCategory._id})`);
    }

    const allFiles = fs.readdirSync(CHAIR_FOLDER)
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
        const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`\n📁 Found ${allFiles.length} images in folder`);

    // Group 34 images into 9 products with 3-4 images each
    // [1-4] Chair 1, [5-8] Chair 2, [9-12] Chair 3, [13-16] Chair 4, 
    // [17-20] Chair 5, [21-24] Chair 6, [25-28] Chair 7, [29-32] Chair 8, [33-34] Chair 9
    
    const groups = [
      { images: [0, 1, 2, 3], name: 'Premium Executive Chair' },
      { images: [4, 5, 6, 7], name: 'Contemporary Accent Chair' },
      { images: [8, 9, 10, 11], name: 'Luxury Dining Chair' },
      { images: [12, 13, 14, 15], name: 'Modern Lounge Chair' },
      { images: [16, 17, 18, 19], name: 'Classic Wing Chair' },
      { images: [20, 21, 22, 23], name: 'Designer Recliner Chair' },
      { images: [24, 25, 26, 27], name: 'Elegant Velvet Chair' },
      { images: [28, 29, 30, 31], name: 'Minimalist Study Chair' },
      { images: [32, 33], name: 'Luxury Corner Chair' },
    ];

    console.log(`\n🪑 Creating ${groups.length} Chair products with carousel images...\n`);

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
        const imagePath = path.join(CHAIR_FOLDER, imageFile);
        
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

      const basePrice = 12000 + (productNum * 3000);
      const marketPrice = basePrice + 4000;
      const productSku = `CHAIR-${productNum.toString().padStart(3, '0')}`;

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: chairCategory._id,
        subCategory: 'Luxury Chair',
        images: productImages,
        price: basePrice,
        marketPrice: marketPrice,
        description: `Exquisite ${productName} crafted with premium materials and superior comfort. Perfect for modern interiors, this chair combines style with functionality. Ideal for living rooms, dining areas, or home offices.`,
        shortDescription: `Premium ${productName} with elegant design and superior comfort.`,
        dimensions: {
          width: 70,
          height: 85,
          depth: 75,
          unit: 'cm'
        },
        material: 'Premium Upholstery + Wood Frame',
        stock: 18,
        isFeatured: productNum <= 2,
        isBestSeller: productNum === 1,
        rating: 4.5 + (Math.random() * 0.5),
        numReviews: Math.floor(Math.random() * 50) + 20,
        warranty: '3 Years',
        metaTitle: `${productName} | Buy Online | Sofa Hi Sofa`,
        metaDescription: `Buy premium ${productName} online. Elegant design, superior comfort. Direct from factory, best prices.`
      };

      const product = new Product(productData);
      await product.save();

      console.log(`   ✅ Product created with ${productImages.length} carousel images`);
      productsCreated++;
    }

    console.log(`\n✅ Successfully created ${productsCreated} Chair products!`);
    console.log(`📸 Total images uploaded: ${allFiles.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

uploadChairs();
