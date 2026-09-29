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

async function fixShortDescriptions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all categories first
    const categories = await Category.find({});
    const catMap = {};
    categories.forEach(c => { catMap[c._id.toString()] = c.slug || ''; });

    // Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} total products\n`);

    let updated = 0;

    for (const product of products) {
      const catSlug = catMap[product.category?.toString()] || '';
      const name = product.name || '';
      let newShortDesc = '';

      if (catSlug.includes('sofa') || catSlug.includes('recliner') || catSlug.includes('chair')) {
        newShortDesc = `Handcrafted ${name} with solid sheesham wood frame, high-resilience foam cushions & 200+ premium fabric options. 10-Year Warranty & free pan-India delivery.`;
      } else if (catSlug.includes('bed')) {
        newShortDesc = `${name} crafted from solid sheesham wood with premium upholstered headboard. Zero creaks, lifetime anti-termite treatment & 15-Year Warranty.`;
      } else if (catSlug.includes('dining')) {
        newShortDesc = `${name} made from solid sheesham/teak wood with premium finish. Sturdy construction, scratch-resistant surface & 10-Year Warranty.`;
      } else {
        newShortDesc = `${name} — handcrafted with premium solid wood & quality materials. Direct from factory with 10-Year Warranty & free pan-India delivery.`;
      }

      const current = product.shortDescription || '';
      const looksLikeMaterial =
        current.includes('Solid Sheesham Wood /') ||
        current.includes('+ Premium Finish') ||
        current.includes('+ High-Resilience Foam') ||
        current.includes('High-Density Foam +') ||
        current.trim() === '' ||
        current.length < 20;

      if (looksLikeMaterial) {
        await Product.updateOne(
          { _id: product._id },
          { $set: { shortDescription: newShortDesc } }
        );
        console.log(`✅ Fixed: ${name.substring(0, 60)}`);
        updated++;
      }
    }

    console.log(`\n🎉 Updated ${updated} products shortDescription`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected');
  }
}

fixShortDescriptions();
