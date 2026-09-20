import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrdersAdmin,
  getOrderStats,
} from "../controllers/orderController.js";
import { protect, admin, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Admin routes — before /:id
router.get("/admin/all", protect, admin, getAllOrdersAdmin);
router.get("/admin/stats", protect, admin, getOrderStats);

// User routes
router.post("/", optionalAuth, createOrder);   // guests allowed
router.get("/my", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;
