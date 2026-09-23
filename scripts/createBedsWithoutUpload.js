import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

const categorySchema = new mongoose.Schema({}, { strict: false });
const Category = mongoose.model('Category', categorySchema);

async function createBeds() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const bedCat = await Category.findOne({ slug: 'bed' });
    
    if (!bedCat) {
      console.log('❌ Bed category not found');
      process.exit(1);
    }

    console.log(`\n🛏️ Creating 16 Bed products with placeholder images...\n`);

    const placeholderImages = [
      'https://res.cloudinary.com/drk8d5s8z/image/upload/v1726751200/sofa-hi-sofa/beds/luxury_bed_lucknow_furniter_1_pq9x0z.png',
      'https://res.cloudinary.com/drk8d5s8z/image/upload/v1726751201/sofa-hi-sofa/beds/luxury_bed_lucknow_furniter_5_k9m2l3.png',
      'https://res.cloudinary.com/drk8d5s8z/image/upload/v1726751202/sofa-hi-sofa/beds/luxury_bed_lucknow_furniter_9_x5p7q9.png',
      'https://res.cloudinary.com/drk8d5s8z/image/upload/v1726751203/sofa-hi-sofa/beds/luxury_bed_lucknow_furniter_13_j2n8v4.png'
    ];

    for (let i = 1; i <= 16; i++) {
      const productName = `Premium Bed ${i}`;
      const productSlug = `premium-bed-${i}`;
      let productSku = `BED-${i.toString().padStart(3, '0')}`;
      
      // Check if SKU already exists
      let existingSku = await Product.findOne({ sku: productSku });
      let counter = 1;
      while (existingSku) {
        productSku = `BED-${i.toString().padStart(3, '0')}-V${counter}`;
        existingSku = await Product.findOne({ sku: productSku });
        counter++;
      }

      const productImages = [];
      for (let j = 0; j < (i < 16 ? 4 : 2); j++) {
        productImages.push({
          url: placeholderImages[j % placeholderImages.length],
          alt: `${productName} - View ${j + 1}`,
          isPrimary: j === 0
        });
      }

      const basePrice = 95000 + (i * 8000);
      const marketPrice = basePrice + 25000;

      const productData = {
        name: productName,
        slug: productSlug,
        sku: productSku,
        category: bedCat._id,
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
        isFeatured: i <= 2,
        isBestSeller: i <= 3,
        rating: 4.6 + (Math.random() * 0.4),
        numReviews: Math.floor(Math.random() * 80) + 30,
        warranty: '15 Years',
        metaTitle: `${productName} | Buy Online | Sofa Hi Sofa`,
        metaDescription: `Premium ${productName} with solid sheesham wood. Direct from factory, best prices.`
      };

      const product = new Product(productData);
      await product.save();

      console.log(`[${i}/16] ✅ Created ${productName}`);
    }

    console.log(`\n✅ Successfully created 16 Bed products!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createBeds();
