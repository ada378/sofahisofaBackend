import Category from "../models/Category.js";

export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ order: 1 });
  res.json(categories);
};

export const getCategoryBySlug = async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json(category);
};

export const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
};

export const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
};

export const deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Category removed" });
};
