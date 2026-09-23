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

async function checkWatches() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    const watchCat = await Category.findOne({ slug: 'watches' });
    console.log(`Category: ${watchCat?.name} (ID: ${watchCat?._id})\n`);

    const watchProducts = await Product.find({ category: watchCat._id }).sort({ createdAt: -1 });
    
    console.log(`Found ${watchProducts.length} products in Watches category:\n`);
    
    watchProducts.slice(0, 10).forEach((p, i) => {
      console.log(`[${i + 1}] ${p.name}`);
      console.log(`    SKU: ${p.sku}`);
      console.log(`    Images: ${p.images?.length || 0}`);
      console.log(`    Price: ₹${p.price}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkWatches();
