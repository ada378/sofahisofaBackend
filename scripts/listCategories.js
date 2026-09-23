import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const categorySchema = new mongoose.Schema({}, { strict: false });
const Category = mongoose.model('Category', categorySchema);

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

async function listAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    const categories = await Category.find({});
    console.log('All Categories:\n');
    categories.forEach((cat, i) => {
      console.log(`[${i + 1}] ${cat.name} (slug: ${cat.slug})`);
    });

    console.log('\n\n--- Checking Products ---\n');

    // Find products with "Clock" or "Watch" in name
    const clockProducts = await Product.find({
      $or: [
        { name: { $regex: 'Clock', $options: 'i' } },
        { name: { $regex: 'Watch', $options: 'i' } }
      ]
    }).limit(15);

    console.log(`Found ${clockProducts.length} products with "Clock" or "Watch" in name:\n`);
    
    clockProducts.forEach((p, i) => {
      console.log(`[${i + 1}] ${p.name}`);
      console.log(`    Category ID: ${p.category}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listAll();
