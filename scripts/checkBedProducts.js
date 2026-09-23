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

async function checkBeds() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    const bedCat = await Category.findOne({ slug: 'bed' });
    
    if (!bedCat) {
      console.log('❌ Bed category not found');
      process.exit(0);
    }

    const bedProducts = await Product.find({ category: bedCat._id }).limit(15);
    
    console.log(`📊 Bed Products: ${bedProducts.length}`);
    bedProducts.forEach((p, i) => {
      console.log(`[${i+1}] ${p.name} - ${p.sku} (${p.images?.length || 0} images)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBeds();
