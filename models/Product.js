import mongoose from "mongoose";
import slugify from "slugify";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true }, // used for SEO friendly URLs: /product/:slug
    sku: { type: String, unique: true, required: true },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subCategory: { type: String }, // e.g. "3 Seater Sofa", "L Shape Sofa"

    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 },

    material: { type: String }, // e.g. Sheesham Wood, Fabric, Leather
    fabricOptions: [{ type: String }], // color/fabric swatches
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
      unit: { type: String, default: "cm" },
    },
    warranty: { type: String, default: "3 Year Warranty" },

    price: { type: Number, required: true }, // selling price
    marketPrice: {
      type: Number,
      required: false,
      default: function () {
        return this.price;
      },
    }, // MRP optional
    discountPercent: {
      type: Number,
      default: function () {
        return this.marketPrice
          ? Math.round(((this.marketPrice - this.price) / this.marketPrice) * 100)
          : 0;
      },
    },

    images: [{ url: String, alt: String }], // alt text required for SEO/image search
    stock: { type: Number, required: true, default: 0 },

    isFeatured: { type: Boolean, default: false },
    isNewLaunch: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },

    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],

    // --- SEO fields (editable per-product from admin) ---
    metaTitle: { type: String },
    metaDescription: { type: String, maxlength: 160 },
    metaKeywords: [{ type: String }],
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(`${this.name}-${this.sku}`, { lower: true, strict: true });
  }

  // Auto-generate SEO Meta Title if not provided
  if (!this.metaTitle && this.name) {
    this.metaTitle = `${this.name} | Buy Online Direct from Factory | Sofa Hi Sofa`;
  }

  // Auto-generate SEO Meta Description if not provided
  if (!this.metaDescription) {
    const baseDesc = this.shortDescription || this.description || `Buy ${this.name} online at best factory price. Handcrafted solid wood frame, 10-Year Warranty & Free Pan-India Delivery.`;
    const cleanDesc = baseDesc.replace(/<[^>]*>?/gm, '').trim();
    this.metaDescription = cleanDesc.length > 155 ? `${cleanDesc.substring(0, 152)}...` : cleanDesc;
  }

  // Auto-generate Meta Keywords if not provided
  if (!this.metaKeywords || this.metaKeywords.length === 0) {
    const keywords = [this.name, "sofa hi sofa", "buy sofa online", "furniture online India"];
    if (this.subCategory) keywords.push(this.subCategory);
    if (this.material) keywords.push(this.material);
    this.metaKeywords = keywords;
  }

  next();
});

// text index for search bar ("sofa", "recliner", "sheesham bed" etc.)
productSchema.index({ name: "text", description: "text", subCategory: "text" });

// Performance indexes for frequent filters
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewLaunch: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model("Product", productSchema);
