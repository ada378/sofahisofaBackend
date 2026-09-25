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

const NEW_NAMES = [
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

function createSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function updateDiningNames() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const diningCat = await Category.findOne({ slug: { $in: ['dining', 'dining-table'] } });
    if (!diningCat) { console.log('❌ Dining category not found'); process.exit(1); }

    const products = await Product.find({ category: diningCat._id }).sort({ createdAt: 1 });
    console.log(`📦 Found ${products.length} dining products\n`);

    for (let i = 0; i < products.length && i < NEW_NAMES.length; i++) {
      const newName = NEW_NAMES[i];
      const newSlug = createSlug(newName);
      await Product.updateOne(
        { _id: products[i]._id },
        {
          $set: {
            name: newName,
            slug: newSlug,
            metaTitle: `${newName} | Buy Online Direct from Factory | Sofa Hi Sofa`,
            metaDescription: `Buy ${newName} online. Solid wood, 10-Year Warranty & free white-glove delivery across India.`,
          }
        }
      );
      console.log(`✅ [${i + 1}] ${newName}`);
    }

    console.log('\n🎉 All dining product names updated!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected');
  }
}

updateDiningNames();
