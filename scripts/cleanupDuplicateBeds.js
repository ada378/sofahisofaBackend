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

async function cleanupBeds() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const bedCat = await Category.findOne({ slug: 'bed' });
    
    if (!bedCat) {
      console.log('No bed category found');
      process.exit(0);
    }

    const allBedProducts = await Product.find({ category: bedCat._id }).sort({ createdAt: -1 });
    console.log(`Found ${allBedProducts.length} total bed products`);

    // Keep only the latest 16 products (recently uploaded ones)
    const toKeep = allBedProducts.slice(0, 16);
    const toDelete = allBedProducts.slice(16);

    console.log(`\nKeeping ${toKeep.length} latest products:`);
    toKeep.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.sku}) - Created: ${p.createdAt}`);
    });

    if (toDelete.length > 0) {
      console.log(`\nDeleting ${toDelete.length} old/duplicate products:`);
      toDelete.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (${p.sku}) - Created: ${p.createdAt}`);
      });

      const deleteIds = toDelete.map(p => p._id);
      const result = await Product.deleteMany({ _id: { $in: deleteIds } });
      
      console.log(`\n✅ Deleted ${result.deletedCount} duplicate bed products`);
    } else {
      console.log('\n✅ No duplicates found - all clean!');
    }

    console.log(`\nFinal bed products count: ${toKeep.length}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupBeds();