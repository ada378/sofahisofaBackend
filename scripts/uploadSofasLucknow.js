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

const SOFA_FOLDER = 'C:\\Users\\dell\\Downloads\\luxury sofa lucknow (131)';
const IMAGES_PER_PRODUCT = 4;

// ── Sofa product names (keyword-rich, SEO-friendly) ──────────────────────────
const SOFA_NAMES = [
  'Kanha Solid Sheesham 3-Seater Sofa Lucknow',
  'Raahi L-Shape Modular Sectional Sofa Lucknow',
  'Rangeen Velvet 2-Seater Loveseat Sofa Lucknow',
  'Bilona Premium Fabric 3-Seater Sofa Lucknow',
  'Sattva Chesterfield Leatherette Sofa Lucknow',
  'Dhara Bouclé Corner Sectional Sofa Lucknow',
  'Komorebi Japandi 3-Seater Sofa Lucknow',
  'Yukon Modular L-Shape Sofa with Ottoman Lucknow',
  'Alora Curved Accent Sofa Lucknow',
  'Vriksha Tufted 4-Seater Sofa Lucknow',
  'Samvaad Royal Wooden Sofa Set Lucknow',
  'Noor Classic 3-2-1 Sofa Set Lucknow',
  'Meera Compact 2-Seater Apartment Sofa Lucknow',
  'Arjun Heavy Duty Fabric Sofa Lucknow',
  'Kavya Scandinavian Minimalist Sofa Lucknow',
  'Priya Luxury Velvet Sectional Sofa Lucknow',
  'Rajan Mid-Century Modern Sofa Lucknow',
  'Shruti High-Back Wingback Sofa Lucknow',
  'Tarun Solid Wood Sofa Set Lucknow',
  'Usha Contemporary Fabric Sofa Lucknow',
  'Varun Modular Sofa with Storage Lucknow',
  'Wren Lounge Chaise Sofa Lucknow',
  'Xara Stain-Resistant Family Sofa Lucknow',
  'Yash Designer L-Shape Sofa Lucknow',
  'Zara Luxury Nappa Leather Sofa Lucknow',
  'Aarav Premium 3-Seater Fabric Sofa Lucknow',
  'Bindu Recliner Corner Sofa Lucknow',
  'Charu Solid Teak Wood Sofa Lucknow',
  'Devika Modular Living Room Sofa Lucknow',
  'Ekta Bouclé 2-Seater Sofa Lucknow',
  'Farhan Contemporary Sofa Set Lucknow',
  'Ganga Luxury Fabric Sofa Lucknow',
  'Hari Classic Chesterfield Sofa Lucknow',
];

async function uploadToCloudinary(imagePath, productName) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'sofa-hi-sofa/sofa',
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

async function uploadSofasLucknow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ── Find or create Sofa category ─────────────────────────────────────────
    let sofaCategory = await Category.findOne({ slug: 'sofa-sets' });
    if (!sofaCategory) {
      sofaCategory = await Category.findOne({ slug: 'sofa' });
    }
    if (!sofaCategory) {
      sofaCategory = await Category.create({
        name: 'Sofa Sets',
        slug: 'sofa-sets',
        description: 'Handcrafted luxury sofa sets direct from factory in Lucknow',
        order: 1,
      });
      console.log('✅ Created Sofa Sets category');
    } else {
      console.log(`✅ Found category: ${sofaCategory.name} (${sofaCategory.slug})`);
    }

    // ── Delete ALL existing sofa products first ───────────────────────────────
    const SOFA_SLUGS = ['sofa', 'sofa-sets', 'l-shape-sofas', 'recliners'];
    const sofaCatsToDelete = await Category.find({ slug: { $in: SOFA_SLUGS } });
    if (sofaCatsToDelete.length > 0) {
      const catIds = sofaCatsToDelete.map(c => c._id);
      const deleted = await Product.deleteMany({ category: { $in: catIds } });
      console.log(`🗑️ Deleted ${deleted.deletedCount} existing sofa products\n`);
    }

    const allFiles = fs.readdirSync(SOFA_FOLDER)
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
        const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`📁 Found ${allFiles.length} images in folder`);

    // ── Group images: 4 per product ──────────────────────────────────────────
    const groups = [];
    for (let i = 0; i < allFiles.length; i += IMAGES_PER_PRODUCT) {
      groups.push(allFiles.slice(i, i + IMAGES_PER_PRODUCT));
    }

    const totalProducts = Math.min(groups.length, SOFA_NAMES.length);
    console.log(`🛋️ Will create ${totalProducts} Sofa products (${IMAGES_PER_PRODUCT} images each)\n`);

    let created = 0;

    for (let idx = 0; idx < totalProducts; idx++) {
      const imageGroup = groups[idx];
      const productNum = idx + 1;
      const productName = SOFA_NAMES[idx];
      const productSlug = createSlug(productName);
      const productSku = `SOFA-LKN-${productNum.toString().padStart(3, '0')}`;

      // Skip if already exists
      const existing = await Product.findOne({ sku: productSku });
      if (existing) {
        console.log(`[${productNum}/${totalProducts}] ⏭️ Already exists: ${productName}`);
        continue;
      }

      console.log(`[${productNum}/${totalProducts}] 🛋️ ${productName}`);

      const productImages = [];

      for (const imageFile of imageGroup) {
        const imagePath = path.join(SOFA_FOLDER, imageFile);
        const uploaded = await uploadToCloudinary(imagePath, productName);
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

      // Price range ₹35,000 – ₹1,20,000 spread across products
      const basePrice = 35000 + (idx * 2800);
      const marketPrice = Math.round(basePrice * 1.35);

      const subCategories = [
        '3-Seater Sofa', 'L-Shape Sofa', '2-Seater Sofa', '3-Seater Sofa',
        '3-Seater Sofa', 'L-Shape Sofa', '3-Seater Sofa', 'L-Shape Sofa',
        'Accent Sofa', '4-Seater Sofa', 'Sofa Set', '3-2-1 Sofa Set',
        '2-Seater Sofa', '3-Seater Sofa', '3-Seater Sofa', 'L-Shape Sofa',
        '3-Seater Sofa', 'Wingback Sofa', 'Wooden Sofa Set', '3-Seater Sofa',
        'Modular Sofa', 'Chaise Sofa', '3-Seater Sofa', 'L-Shape Sofa',
        'Leather Sofa', '3-Seater Sofa', 'Corner Sofa', 'Wooden Sofa',
        'Modular Sofa', '2-Seater Sofa', 'Sofa Set', '3-Seater Sofa', '3-Seater Sofa',
      ];

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: sofaCategory._id,
        subCategory: subCategories[idx] || '3-Seater Sofa',
        images: productImages,
        price: basePrice,
        marketPrice: marketPrice,
        description: `${productName} — handcrafted with a solid sheesham wood frame, high-resilience foam cushions, and premium fabric upholstery. Built at our own factory in Lucknow for direct-to-home delivery across India. 10-Year Frame Warranty included.`,
        shortDescription: `Luxury ${subCategories[idx] || '3-Seater Sofa'} with solid wood frame, 200+ fabric options & free pan-India delivery.`,
        material: 'Solid Sheesham Wood + High-Resilience Foam + Premium Fabric',
        fabricOptions: ['Linen Beige', 'Velvet Grey', 'Bouclé Ivory', 'Leatherette Black', 'Velvet Mustard'],
        dimensions: { width: 220, height: 90, depth: 95, unit: 'cm' },
        seatingCapacity: subCategories[idx]?.includes('2-Seater') ? 2 : subCategories[idx]?.includes('4-Seater') ? 4 : 3,
        stock: 15,
        isFeatured: productNum <= 4,
        isBestSeller: productNum <= 6,
        rating: parseFloat((4.4 + Math.random() * 0.5).toFixed(1)),
        numReviews: Math.floor(Math.random() * 120) + 40,
        warranty: '10 Years',
        metaTitle: `${productName} | Buy Online Direct from Factory | Sofa Hi Sofa`,
        metaDescription: `Buy ${productName} online. Solid sheesham wood, 200+ fabrics, 10-Year Warranty & free white-glove delivery across India.`,
      };

      const product = new Product(productData);
      await product.save();
      console.log(`   ✅ Created with ${productImages.length} images\n`);
      created++;
    }

    console.log(`\n🎉 Done! Created ${created} new sofa products.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected');
  }
}

uploadSofasLucknow();
