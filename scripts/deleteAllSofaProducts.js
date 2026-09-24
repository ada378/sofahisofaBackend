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

// All sofa-related category slugs
const SOFA_SLUGS = ['sofa', 'sofa-sets', 'l-shape-sofas', 'recliners'];

async function deleteAllSofaProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all matching categories
    const categories = await Category.find({ slug: { $in: SOFA_SLUGS } });

    if (categories.length === 0) {
      console.log('⚠️ No sofa-related categories found');
      process.exit(0);
    }

    console.log('📂 Found categories:');
    categories.forEach(c => console.log(`   • ${c.name} (${c.slug})`));
    console.log('');

    const categoryIds = categories.map(c => c._id);

    // Count before delete
    const countBefore = await Product.countDocuments({ category: { $in: categoryIds } });
    console.log(`🗑️ Deleting ${countBefore} sofa products...\n`);

    const result = await Product.deleteMany({ category: { $in: categoryIds } });

    console.log(`✅ Deleted ${result.deletedCount} sofa products successfully!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected');
  }
}

deleteAllSofaProducts();
