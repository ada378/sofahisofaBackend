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
  const { name, email, phone, password } = req.body;
  const exists = await User.findOne({ $or: [{ email }, { phone }] });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const user = await User.create({ name, email, phone, password });
  const token = signToken(user._id);
  sendTokenCookie(res, token);
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = signToken(user._id);
  sendTokenCookie(res, token);
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
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
