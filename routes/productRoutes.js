import express from "express";
import {
  getProducts,
  getAllProductsAdmin,
  getProductBySlug,
  getProductById,
  getProductStats,
  createProduct,
  bulkCreateProducts,
  updateProduct,
  deleteProduct,
  addReview,
} from "../controllers/productController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);

// Admin-only routes — MUST come before /:slug to avoid slug conflict
router.get("/admin/all", protect, admin, getAllProductsAdmin);
router.get("/admin/stats", protect, admin, getProductStats);
router.get("/id/:id", protect, admin, getProductById);
router.post("/bulk", protect, admin, bulkCreateProducts);

// Public slug route
router.get("/:slug", getProductBySlug);

// Admin CRUD
router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

// Auth user review
router.post("/:id/reviews", protect, addReview);

export default router;
