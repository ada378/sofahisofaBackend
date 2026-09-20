import mongoose from "mongoose";
import User from "../models/User.js";

const mongoURI = "mongodb+srv://adarsh03542_db_user:TTGN9Tzll8KDcQVy@sofahisofa.osv0yii.mongodb.net/?appName=SofahiSofa";

async function checkUsers() {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected\n");

    // Get all users
    const users = await User.find({}).select("name email phone role createdAt");
    
    console.log(`📊 Total Users in Database: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log("✅ No users found - Database is clean!\n");
    } else {
      console.log("👥 Existing Users:\n");
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   ID: ${user._id}\n`);
      });
    }

    // Check for duplicate emails
    const emails = users.map(u => u.email);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      console.log("⚠️ Duplicate Emails Found:");
      duplicateEmails.forEach(email => console.log(`   - ${email}`));
      console.log();
    }

    // Check for duplicate phones
    const phones = users.map(u => u.phone);
    const duplicatePhones = phones.filter((phone, index) => phones.indexOf(phone) !== index);
    if (duplicatePhones.length > 0) {
      console.log("⚠️ Duplicate Phones Found:");
      duplicatePhones.forEach(phone => console.log(`   - ${phone}`));
      console.log();
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkUsers();
