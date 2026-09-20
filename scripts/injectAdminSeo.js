import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function injectAdminSeo() {
  try {
    console.log("🚀 Injecting Admin & SEO Users into Existing Database...\n");
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected:", mongoose.connection.host);
    console.log();

    // Check existing users
    const existingUsers = await User.find({});
    console.log(`📊 Current users: ${existingUsers.length}`);
    if (existingUsers.length > 0) {
      existingUsers.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
      });
    }
    console.log();

    // Admin User
    console.log("1️⃣ Creating/Updating Admin User...");
    const adminEmail = "admin@sofahisofa.com";
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      console.log("⚠️  Admin exists, updating password...");
      adminExists.password = "Admin@SofaHiSofa2026";
      adminExists.role = "admin";
      await adminExists.save();
      console.log("✅ Admin password updated!");
    } else {
      await User.create({
        name: "Sofa Hi Sofa Admin",
        email: adminEmail,
        phone: "9999999999",
        password: "Admin@SofaHiSofa2026",
        role: "admin"
      });
      console.log("✅ Admin user created!");
    }
    console.log();

    // SEO User
    console.log("2️⃣ Creating/Updating SEO User...");
    const seoEmail = "seo@sofahisofa.com";
    const seoExists = await User.findOne({ email: seoEmail });
    
    if (seoExists) {
      console.log("⚠️  SEO exists, updating password...");
      seoExists.password = "Seo@SofaHiSofa2026";
      seoExists.role = "seo";
      await seoExists.save();
      console.log("✅ SEO password updated!");
    } else {
      await User.create({
        name: "SEO Specialist",
        email: seoEmail,
        phone: "8888888888",
        password: "Seo@SofaHiSofa2026",
        role: "seo"
      });
      console.log("✅ SEO user created!");
    }
    console.log();

    // Final summary
    const finalUsers = await User.find({});
    console.log("🎉 Injection Complete!\n");
    console.log(`📊 Total users now: ${finalUsers.length}\n`);
    
    console.log("🔐 Login Credentials:\n");
    console.log("Admin Panel:");
    console.log("  URL: https://www.thesofahisofa.com/admin/login");
    console.log("  Email: admin@sofahisofa.com");
    console.log("  Password: Admin@SofaHiSofa2026\n");
    
    console.log("SEO Panel:");
    console.log("  URL: https://www.thesofahisofa.com/seo/login");
    console.log("  Email: seo@sofahisofa.com");
    console.log("  Password: Seo@SofaHiSofa2026\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

injectAdminSeo();
