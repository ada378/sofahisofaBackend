import express from "express";
import {
  getBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blogController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getBlogs);
router.get("/:slug", getBlogBySlug);

// Admin routes
router.get("/admin/all", protect, admin, getAllBlogsAdmin);
router.get("/admin/id/:id", protect, admin, getBlogById);
router.post("/", protect, admin, createBlog);
router.put("/:id", protect, admin, updateBlog);
router.delete("/:id", protect, admin, deleteBlog);

export default router;
