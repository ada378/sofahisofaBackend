import express from "express";
import {
  getSeoSettings,
  updateSeoSettings,
  getProductsSeo,
  updateProductSeo,
  getCategoriesSeo,
  updateCategorySeo,
  getSeoAudit,
} from "../controllers/seoController.js";
import { protect, seoOrAdmin } from "../middleware/auth.js";

const router = express.Router();

// Global SEO settings
router.get("/settings", getSeoSettings);
router.put("/settings", protect, seoOrAdmin, updateSeoSettings);

// SEO audit overview
router.get("/audit", protect, seoOrAdmin, getSeoAudit);

// Per-product SEO
router.get("/products", protect, seoOrAdmin, getProductsSeo);
router.put("/products/:id", protect, seoOrAdmin, updateProductSeo);

// Per-category SEO
router.get("/categories", protect, seoOrAdmin, getCategoriesSeo);
router.put("/categories/:id", protect, seoOrAdmin, updateCategorySeo);

export default router;
