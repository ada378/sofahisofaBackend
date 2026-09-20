import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // "Sofa & Recliners", "Bedroom", "Dining"
    slug: { type: String, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    image: { url: String, alt: String },
    description: { type: String },
    metaTitle: String,
    metaDescription: String,
    order: { type: Number, default: 0 }, // controls menu order
  },
  { timestamps: true }
);

categorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  if (!this.metaTitle && this.name) {
    this.metaTitle = `${this.name} Collection | Buy Online Direct from Factory | Sofa Hi Sofa`;
  }

  if (!this.metaDescription) {
    const descText = this.description || `Explore our handcrafted luxury ${this.name} collection. Solid wood frame, 200+ custom fabric swatches, 10-Year Warranty & Free Pan-India Delivery.`;
    const cleanDesc = descText.replace(/<[^>]*>?/gm, '').trim();
    this.metaDescription = cleanDesc.length > 155 ? `${cleanDesc.substring(0, 152)}...` : cleanDesc;
  }

  next();
});

export default mongoose.model("Category", categorySchema);
