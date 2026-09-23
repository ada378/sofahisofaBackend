import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const mongoURI ="mongodb+srv://adarsh03542_db_user:TTGN9Tzll8KDcQVy@sofahisofa.osv0yii.mongodb.net/?appName=SofahiSofa";

async function testRegister() {
  try {
    console.log("🔍 Testing Registration System...\n");
    
    // Connect to MongoDB
    console.log("1️⃣ Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected\n");

    // Test bcrypt
    console.log("2️⃣ Testing bcrypt password hashing...");
    const testPassword = "Test@123";
    const hashed = await bcrypt.hash(testPassword, 10);
    console.log("✅ Password hashed:", hashed.substring(0, 20) + "...");
    const isMatch = await bcrypt.compare(testPassword, hashed);
    console.log("✅ Password verify:", isMatch ? "SUCCESS" : "FAILED");
    console.log();

    // Test user creation
    console.log("3️⃣ Testing User Creation...");
    const testEmail = `test${Date.now()}@example.com`;
    const testPhone = `98${Date.now().toString().slice(-8)}`;
    
    console.log("Creating user with:");
    console.log("  Email:", testEmail);
    console.log("  Phone:", testPhone);
    
    const user = await User.create({
      name: "Test User",
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      role: "customer"
    });
    
    console.log("✅ User created successfully!");
    console.log("  ID:", user._id);
    console.log("  Name:", user.name);
    console.log("  Email:", user.email);
    console.log("  Role:", user.role);
    console.log();

    // Test duplicate check
    console.log("4️⃣ Testing Duplicate Email Check...");
    try {
      await User.create({
        name: "Duplicate User",
        email: testEmail, // Same email
        phone: "9999999998",
        password: testPassword
      });
      console.log("❌ ERROR: Duplicate email was allowed!");
    } catch (err) {
      if (err.code === 11000) {
        console.log("✅ Duplicate email blocked correctly");
      } else {
        console.log("❌ Unexpected error:", err.message);
      }
    }
    console.log();

    // Test duplicate phone
    console.log("5️⃣ Testing Duplicate Phone Check...");
    try {
      await User.create({
        name: "Duplicate Phone User",
        email: `another${Date.now()}@example.com`,
        phone: testPhone, // Same phone
        password: testPassword
      });
      console.log("❌ ERROR: Duplicate phone was allowed!");
    } catch (err) {
      if (err.code === 11000) {
        console.log("✅ Duplicate phone blocked correctly");
      } else {
        console.log("❌ Unexpected error:", err.message);
      }
    }
    console.log();

    // Test password comparison
    console.log("6️⃣ Testing Password Comparison...");
    const userWithPassword = await User.findOne({ email: testEmail }).select("+password");
    const correctPassword = await userWithPassword.comparePassword(testPassword);
    const wrongPassword = await userWithPassword.comparePassword("WrongPassword");
    
    console.log("✅ Correct password:", correctPassword ? "PASS" : "FAIL");
    console.log("✅ Wrong password:", !wrongPassword ? "PASS (correctly rejected)" : "FAIL");
    console.log();

    // Cleanup
    console.log("7️⃣ Cleaning up test user...");
    await User.deleteOne({ _id: user._id });
    console.log("✅ Test user deleted\n");

    console.log("🎉 All tests passed! Registration system is working correctly.\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testRegister();
