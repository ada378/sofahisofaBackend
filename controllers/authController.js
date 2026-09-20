import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const sendTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: (Number(process.env.COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000,
  });
};

// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Log incoming data (remove in production)
    console.log("📝 Registration attempt:", { name, email: email?.toLowerCase(), phone: phone?.trim() });

    // Validate required fields
    if (!name || !email || !phone || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate password length
    if (password.length < 6) {
      console.log("❌ Password too short");
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check email with case-insensitive search
    const emailToCheck = email.toLowerCase().trim();
    console.log("🔍 Checking email:", emailToCheck);
    
    const emailExists = await User.findOne({ email: emailToCheck });
    if (emailExists) {
      console.log("❌ Email already exists:", emailToCheck);
      return res.status(400).json({ message: "This email is already registered. Please login." });
    }

    // Check phone
    const phoneToCheck = phone.trim();
    console.log("🔍 Checking phone:", phoneToCheck);
    
    const phoneExists = await User.findOne({ phone: phoneToCheck });
    if (phoneExists) {
      console.log("❌ Phone already exists:", phoneToCheck);
      return res.status(400).json({ message: "This phone number is already registered." });
    }

    // Create user
    console.log("✅ Creating new user...");
    const user = await User.create({ 
      name: name.trim(), 
      email: emailToCheck, 
      phone: phoneToCheck, 
      password,
      role: "customer"
    });
    
    console.log("✅ User created successfully:", user._id, user.email);
    
    const token = signToken(user._id);
    sendTokenCookie(res, token);
    
    res.status(201).json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      token 
    });
    
    console.log("✅ Registration response sent successfully");
    
  } catch (err) {
    console.error("❌ Register error:", err.message);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Error name:", err.name);
    
    // Send more specific error message
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        message: `This ${field} is already registered.` 
      });
    }
    
    res.status(500).json({ 
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("🔐 Login attempt:", { email: email?.toLowerCase(), hasPassword: !!password });
    
    // Validate inputs
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const emailToCheck = email.toLowerCase().trim();
    console.log("🔍 Looking for user:", emailToCheck);
    
    const user = await User.findOne({ email: emailToCheck }).select("+password");
    
    if (!user) {
      console.log("❌ User not found:", emailToCheck);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    console.log("✅ User found:", user._id, user.email, user.role);
    
    // Verify password
    console.log("🔒 Verifying password...");
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      console.log("❌ Password mismatch");
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    console.log("✅ Password verified");
    
    // Generate token
    const token = signToken(user._id);
    sendTokenCookie(res, token);
    
    console.log("✅ Login successful, sending response");
    
    res.json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      token 
    });
    
  } catch (err) {
    console.error("❌ Login error:", err.message);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Error name:", err.name);
    
    res.status(500).json({ 
      message: "Login failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};

// @route POST /api/auth/logout
export const logout = async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  res.json(req.user);
};
