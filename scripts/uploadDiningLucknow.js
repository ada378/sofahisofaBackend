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

const DINING_FOLDER = 'C:\\Users\\dell\\Downloads\\luxury dinning table lucknow (34)';
const IMAGES_PER_PRODUCT = 3;

// ── Dining product names (keyword-rich, SEO-friendly) ────────────────────────
const DINING_NAMES = [
  'Sheesham Wood Dining Table Set Lucknow',
  'Teak Wood Round Dining Table Set Lucknow',
  'Solid Sheesham Wood Rectangular Dining Table Lucknow',
  'Solid Teak Wood Dining Table with Chairs Lucknow',
  'Handcrafted Sheesham Wood Dining Set Lucknow',
  'Royal Solid Teak Wood Dining Table Set Lucknow',
  'Compact Sheesham Wood Dining Table Lucknow',
  'Luxury Solid Wood Dining Set with Upholstered Chairs Lucknow',
  'Teak Wood Extendable Dining Table Set Lucknow',
  'Classic Solid Sheesham Wood Dining Table Lucknow',
  'Solid Wood Dining Table with Bench Lucknow',
  'Handcrafted Sheesham Wood Dining Table Set Lucknow',
  'Contemporary Solid Teak Wood Dining Table Lucknow',
  'Rustic Solid Sheesham Farmhouse Dining Table Lucknow',
  'Premium Walnut Finish Solid Wood Dining Set Lucknow',
];

async function uploadToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'sofa-hi-sofa/dining-table',
      transformation: [
        { width: 1200, height: 1200, crop: 'pad', background: 'white', quality: 'auto:good' }
      ],
    });
    console.log(`   ✅ Uploaded: ${path.basename(imagePath)}`);
    return { url: result.secure_url };
  } catch (error) {
    console.error(`   ❌ Failed: ${path.basename(imagePath)} — ${error.message}`);
    return null;
  }
}

function createSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function uploadDiningLucknow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ── Find or create Dining category ───────────────────────────────────────
    let diningCategory = await Category.findOne({ slug: 'dining' });
    if (!diningCategory) {
      diningCategory = await Category.findOne({ slug: 'dining-table' });
    }
    if (!diningCategory) {
      diningCategory = await Category.create({
        name: 'Dining Sets',
        slug: 'dining',
        description: 'Handcrafted luxury dining table sets direct from factory in Lucknow',
        order: 4,
      });
      console.log('✅ Created Dining Sets category');
    } else {
      console.log(`✅ Found category: ${diningCategory.name} (${diningCategory.slug})`);
    }

    // ── Delete existing dining products ──────────────────────────────────────
    const DINING_SLUGS = ['dining', 'dining-table', 'dining-sets'];
    const diningCatsToDelete = await Category.find({ slug: { $in: DINING_SLUGS } });
    if (diningCatsToDelete.length > 0) {
      const catIds = diningCatsToDelete.map(c => c._id);
      const deleted = await Product.deleteMany({ category: { $in: catIds } });
      console.log(`🗑️ Deleted ${deleted.deletedCount} existing dining products\n`);
    }

    // ── Read & sort image files ───────────────────────────────────────────────
    const allFiles = fs.readdirSync(DINING_FOLDER)
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
        const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`📁 Found ${allFiles.length} images in folder`);

    // ── Group images: 3 per product ──────────────────────────────────────────
    const groups = [];
    for (let i = 0; i < allFiles.length; i += IMAGES_PER_PRODUCT) {
      groups.push(allFiles.slice(i, i + IMAGES_PER_PRODUCT));
    }

    const totalProducts = Math.min(groups.length, DINING_NAMES.length);
    console.log(`🍽️ Will create ${totalProducts} Dining products (${IMAGES_PER_PRODUCT} images each)\n`);

    let created = 0;

    for (let idx = 0; idx < totalProducts; idx++) {
      const imageGroup = groups[idx];
      const productNum = idx + 1;
      const productName = DINING_NAMES[idx];
      const productSlug = createSlug(productName);
      const productSku = `DINING-LKN-${productNum.toString().padStart(3, '0')}`;

      console.log(`[${productNum}/${totalProducts}] 🍽️ ${productName}`);

      const productImages = [];

      for (const imageFile of imageGroup) {
        const imagePath = path.join(DINING_FOLDER, imageFile);
        const uploaded = await uploadToCloudinary(imagePath);
        if (uploaded) {
          productImages.push({
            url: uploaded.url,
            alt: `${productName} - View ${productImages.length + 1}`,
            isPrimary: productImages.length === 0,
          });
        }
      }

      if (productImages.length === 0) {
        console.log(`   ⚠️ No images uploaded, skipping\n`);
        continue;
      }

      const subCategories = [
        '6-Seater Dining Set', '4-Seater Dining Set', '6-Seater Dining Set',
        '8-Seater Dining Set', '4-Seater Dining Set', '6-Seater Dining Set',
        '4-Seater Dining Set', '6-Seater Dining Set', '8-Seater Dining Set',
        '4-Seater Dining Set', '6-Seater Dining Set', '4-Seater Dining Set',
        '6-Seater Dining Set', '4-Seater Dining Set', '6-Seater Dining Set',
      ];

      // Price range ₹28,000 – ₹95,000
      const basePrice = 28000 + (idx * 4500);
      const marketPrice = Math.round(basePrice * 1.35);

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: diningCategory._id,
        subCategory: subCategories[idx] || '6-Seater Dining Set',
        images: productImages,
        price: basePrice,
        marketPrice: marketPrice,
        description: `${productName} — handcrafted with solid sheesham/teak wood frame, premium finish, and sturdy construction. Built at our own factory in Lucknow for direct-to-home delivery across India. 10-Year Frame Warranty included.`,
        shortDescription: `Luxury ${subCategories[idx] || '6-Seater Dining Set'} with solid wood frame & free pan-India delivery.`,
        material: 'Solid Sheesham Wood / Teak Wood + Premium Finish',
        dimensions: { width: 150, height: 76, depth: 90, unit: 'cm' },
        stock: 10,
        isFeatured: productNum <= 3,
        isBestSeller: productNum <= 5,
        rating: parseFloat((4.3 + Math.random() * 0.6).toFixed(1)),
        numReviews: Math.floor(Math.random() * 90) + 30,
        warranty: '10 Years',
        metaTitle: `${productName} | Buy Online Direct from Factory | Sofa Hi Sofa`,
        metaDescription: `Buy ${productName} online. Solid sheesham wood, 10-Year Warranty & free white-glove delivery across India.`,
      };

      const product = new Product(productData);
      await product.save();
      console.log(`   ✅ Created with ${productImages.length} images\n`);
      created++;
    }

    console.log(`\n🎉 Done! Created ${created} new dining products.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected');
  }
}

uploadDiningLucknow();
