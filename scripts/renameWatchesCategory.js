import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const catSchema = new mongoose.Schema({}, { strict: false });
const Category = mongoose.model('Category', catSchema);

async function rename() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected\n');

  const cat = await Category.findOne({ $or: [{ slug: 'watches-and-clocks' }, { name: /watch/i }] });
  if (!cat) { console.log('❌ Category not found'); process.exit(0); }

  console.log(`Found: ${cat.name} (${cat.slug})`);
  await Category.updateOne({ _id: cat._id }, { $set: { name: 'Clocks', slug: 'clocks' } });
  console.log('✅ Renamed to: Clocks (clocks)');

  await mongoose.connection.close();
}

rename().catch(console.error);
