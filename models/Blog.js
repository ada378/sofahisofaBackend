import mongoose from "mongoose";
import slugify from "slugify";

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    category: { type: String, default: "General" },
    author: { type: String, default: "Sofa Hi Sofa Team" },
    tags: [{ type: String }],
    featuredImage: {
      url: { type: String, default: "" },
      alt: { type: String, default: "" },
    },
    excerpt: { type: String, maxlength: 300 },
    content: { type: String, required: true },
    faqs: [faqSchema],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    metaTitle: { type: String },
    metaDescription: { type: String },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug from title
blogSchema.pre("save", async function (next) {
  if (this.isModified("title") || !this.slug) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;
    while (await mongoose.model("Blog").findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }

  if (!this.metaTitle) this.metaTitle = `${this.title} | Sofa Hi Sofa Blog`;
  if (!this.metaDescription && this.excerpt) this.metaDescription = this.excerpt.substring(0, 160);

  next();
});

export default mongoose.model("Blog", blogSchema);
