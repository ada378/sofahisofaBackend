import Blog from "../models/Blog.js";
import { v2 as cloudinary } from "cloudinary";

// @desc    Get all published blogs (public)
// @route   GET /api/blogs
export const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const tag = req.query.tag;

    const filter = { status: "published" };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    const total = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-content"); // exclude full content from listing

    res.json({ blogs, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single blog by slug (public)
// @route   GET /api/blogs/:slug
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: "published" });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Increment views
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });

    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all blogs (admin — includes drafts)
// @route   GET /api/blogs/admin/all
export const getAllBlogsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Blog.countDocuments();
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-content");

    res.json({ blogs, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single blog by ID (admin)
// @route   GET /api/blogs/admin/:id
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create blog
// @route   POST /api/blogs
export const createBlog = async (req, res) => {
  try {
    const { title, slug, category, author, tags, featuredImage, excerpt, content, faqs, status, metaTitle, metaDescription } = req.body;

    if (!title || !content) return res.status(400).json({ message: "Title and content are required" });

    const blog = new Blog({
      title, slug, category, author, tags,
      featuredImage, excerpt, content, faqs,
      status: status || "draft",
      metaTitle, metaDescription,
    });

    await blog.save();
    res.status(201).json({ message: "Blog created", blog });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const fields = ["title", "slug", "category", "author", "tags", "featuredImage", "excerpt", "content", "faqs", "status", "metaTitle", "metaDescription"];
    fields.forEach(f => { if (req.body[f] !== undefined) blog[f] = req.body[f]; });

    await blog.save();
    res.json({ message: "Blog updated", blog });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    await blog.deleteOne();
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
