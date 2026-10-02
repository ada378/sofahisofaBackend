const mongoose = require('mongoose');
require('dotenv').config();

async function updateCategory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    const result = await db.collection('categories').updateOne(
      { slug: { $in: ['watches', 'watches-and-clocks'] } },
      { 
        $set: { 
          name: 'Clocks', 
          slug: 'clocks', 
          description: 'Luxury wall clocks', 
          metaTitle: 'Clocks Collection | Buy Online Direct from Factory | Sofa Hi Sofa', 
          metaDescription: 'Luxury wall clocks' 
        } 
      }
    );
    
    console.log('Update result:', result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateCategory();
