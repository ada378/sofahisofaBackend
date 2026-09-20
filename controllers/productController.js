import Product from "../models/Product.js";
import Category from "../models/Category.js";

// @desc   Get products (public) — search, filter, sort, paginate
// @route  GET /api/products
export const getProducts = async (req, res) => {
  const pageSize = Number(req.query.limit) || 12;
  const page = Number(req.query.page) || 1;

  const filter = {};
  if (req.query.keyword) filter.$text = { $search: req.query.keyword };
  
  // Handle category filtering by slug or ID
  if (req.query.category) {
    try {
      // Try to find by slug first
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        filter.category = category._id;
      } else {
        // If not found by slug, try as ID
        filter.category = req.query.category;
      }
    } catch (err) {
      filter.category = req.query.category;
    }
  }
  
  if (req.query.subCategory) filter.subCategory = req.query.subCategory;
  if (req.query.material) filter.material = req.query.material;
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }
  if (req.query.isBestSeller) filter.isBestSeller = true;
  if (req.query.isNewLaunch) filter.isNewLaunch = true;
  if (req.query.isFeatured) filter.isFeatured = true;

  let sortOption = { createdAt: -1 };
  if (req.query.sort === "price_asc") sortOption = { price: 1 };
  if (req.query.sort === "price_desc") sortOption = { price: -1 };
  if (req.query.sort === "rating") sortOption = { rating: -1 };

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sortOption)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate("category", "name slug");

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
};

// @desc   Admin — get ALL products with search/pagination (includes out of stock)
// @route  GET /api/products/admin/all
export const getAllProductsAdmin = async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;

  const filter = {};
  if (req.query.keyword) {
    filter.$or = [
      { name: { $regex: req.query.keyword, $options: "i" } },
      { sku: { $regex: req.query.keyword, $options: "i" } },
    ];
  }
  if (req.query.category) {
    // Handle both ObjectId and slug
    try {
      // Try to find by slug first
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        filter.category = category._id;
      } else {
        // If not found by slug, try as ID
        filter.category = req.query.category;
      }
    } catch (err) {
      filter.category = req.query.category;
    }
  }

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate("category", "name slug");

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
};

// @desc   Get single product by slug
// @route  GET /api/products/:slug
export const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate("category", "name slug");
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

// @desc   Get single product by ID (admin use)
// @route  GET /api/products/id/:id
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name slug");
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

// @desc   Create product (admin)
// @route  POST /api/products
export const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const created = await product.save();
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc   Bulk create products (admin)
// @route  POST /api/products/bulk
export const bulkCreateProducts = async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Please provide an array of products to import" });
    }

    const created = [];
    for (const item of items) {
      // Resolve category slug to ObjectId if needed
      if (item.category && typeof item.category === "string") {
        try {
          const category = await Category.findOne({ slug: item.category });
          if (category) {
            item.category = category._id;
          }
          // If not found by slug, keep as-is (assume it's already an ID)
        } catch (err) {
          // If error, keep category as-is
        }
      }

      const product = new Product(item);
      const saved = await product.save();
      created.push(saved);
    }

    res.status(201).json({
      message: `${created.length} products imported successfully`,
      count: created.length,
      products: created,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc   Update product (admin)
// @route  PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    Object.assign(product, req.body);
    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc   Delete product (admin)
// @route  DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  await product.deleteOne();
  res.json({ message: "Product removed" });
};

// @desc   Add product review
// @route  POST /api/products/:id/reviews
export const addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) return res.status(400).json({ message: "Product already reviewed" });

  product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ message: "Review added" });
};

// @desc   Admin dashboard stats
// @route  GET /api/products/admin/stats
export const getProductStats = async (req, res) => {
  const [total, outOfStock, featured, newLaunch, bestSeller] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ stock: 0 }),
    Product.countDocuments({ isFeatured: true }),
    Product.countDocuments({ isNewLaunch: true }),
    Product.countDocuments({ isBestSeller: true }),
  ]);
  res.json({ total, outOfStock, inStock: total - outOfStock, featured, newLaunch, bestSeller });
};
