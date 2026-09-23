import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const categorySchema = new mongoose.Schema({}, { strict: false });
const Category = mongoose.model('Category', categorySchema);

async function addBedCategory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    const allCategories = await Category.find({});
    console.log('Current Categories:');
    allCategories.forEach((cat, i) => {
      console.log(`[${i+1}] ${cat.name} (slug: ${cat.slug})`);
    });

    const bedCat = await Category.findOne({ slug: 'bed' });
    
    if (!bedCat) {
      console.log('\n❌ Bed category missing - adding it...');
      const result = await Category.create({
        name: 'Bed',
        slug: 'bed',
        description: 'Luxury beds and bedroom furniture',
        order: 2
      });
      console.log('✅ Bed category added with ID:', result._id);
    } else {
      console.log('\n✅ Bed category already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addBedCategory();
