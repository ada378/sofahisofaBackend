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

async function deleteAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    const mirrorCat = await Category.findOne({ slug: 'mirror' });
    
    if (!mirrorCat) {
      console.log('No mirror category found');
      process.exit(0);
    }

    const result = await Product.deleteMany({ category: mirrorCat._id });
    
    console.log(`✅ Deleted ${result.deletedCount} mirror products\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

deleteAll();
