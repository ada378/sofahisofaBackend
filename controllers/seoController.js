import slugify from "slugify";
import SeoSettings from "../models/SeoSettings.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

// ─────────────────────────────────────────────
// GLOBAL SEO SETTINGS
// ─────────────────────────────────────────────

// @desc   Get global SEO settings
// @route  GET /api/seo/settings
export const getSeoSettings = async (req, res) => {
  const settings = await SeoSettings.findOne({ key: "global" }).lean();
  res.json(settings || {});
};

// @desc   Update global SEO settings (admin only)
// @route  PUT /api/seo/settings
export const updateSeoSettings = async (req, res) => {
  const settings = await SeoSettings.findOneAndUpdate(
    { key: "global" },
    { ...req.body, key: "global" },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(settings);
};

// ─────────────────────────────────────────────
// PER-PAGE SEO — PRODUCTS
// ─────────────────────────────────────────────

// @desc   Get SEO meta for all products (paginated list for admin panel)
// @route  GET /api/seo/products
export const getProductsSeo = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.limit) || 20;

  const count = await Product.countDocuments();
  const products = await Product.find()
    .select("name slug metaTitle metaDescription metaKeywords updatedAt")
    .sort({ updatedAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
};

// @desc   Update SEO meta for a single product (admin/SEO only)
// @route  PUT /api/seo/products/:id
export const updateProductSeo = async (req, res) => {
  const { metaTitle, metaDescription, metaKeywords, slug } = req.body;
  const updateData = { metaTitle, metaDescription, metaKeywords };

  if (slug) {
    updateData.slug = slugify(slug, { lower: true, strict: true });
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select("name slug metaTitle metaDescription metaKeywords");

  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

// ─────────────────────────────────────────────
// PER-PAGE SEO — CATEGORIES
// ─────────────────────────────────────────────

// @desc   Get SEO meta for all categories
// @route  GET /api/seo/categories
export const getCategoriesSeo = async (req, res) => {
  const categories = await Category.find()
    .select("name slug metaTitle metaDescription order updatedAt")
    .sort({ order: 1 });
  res.json(categories);
};

// @desc   Update SEO meta for a single category (admin/SEO only)
// @route  PUT /api/seo/categories/:id
export const updateCategorySeo = async (req, res) => {
  const { metaTitle, metaDescription, slug } = req.body;
  const updateData = { metaTitle, metaDescription };

  if (slug) {
    updateData.slug = slugify(slug, { lower: true, strict: true });
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select("name slug metaTitle metaDescription");

  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json(category);
};

// ─────────────────────────────────────────────
// SEO AUDIT HELPER — Returns overview stats
// ─────────────────────────────────────────────

// @desc   Get SEO audit overview (counts of missing meta)
// @route  GET /api/seo/audit
export const getSeoAudit = async (req, res) => {
  const [
    totalProducts,
    productsMissingTitle,
    productsMissingDesc,
    totalCategories,
    categoriesMissingTitle,
    categoriesMissingDesc,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ $or: [{ metaTitle: { $exists: false } }, { metaTitle: "" }] }),
    Product.countDocuments({ $or: [{ metaDescription: { $exists: false } }, { metaDescription: "" }] }),
    Category.countDocuments(),
    Category.countDocuments({ $or: [{ metaTitle: { $exists: false } }, { metaTitle: "" }] }),
    Category.countDocuments({ $or: [{ metaDescription: { $exists: false } }, { metaDescription: "" }] }),
  ]);

  res.json({
    products: {
      total: totalProducts,
      missingTitle: productsMissingTitle,
      missingDescription: productsMissingDesc,
      optimized: totalProducts - productsMissingTitle,
    },
    categories: {
      total: totalCategories,
      missingTitle: categoriesMissingTitle,
      missingDescription: categoriesMissingDesc,
      optimized: totalCategories - categoriesMissingTitle,
    },
  });
};
