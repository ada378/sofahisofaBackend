import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function updateCategory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    
    const r1 = await db.collection('categories').updateOne(
      { slug: 'sofa' },
      { $set: { heading: 'Best Sofa In Lucknow' } }
    );
    console.log('Sofa update:', r1);

    const r2 = await db.collection('categories').updateOne(
      { slug: 'bed' },
      { $set: { heading: 'Best Bed In Lucknow' } }
    );
    console.log('Bed update:', r2);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateCategory();
