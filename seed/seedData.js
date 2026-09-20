import dotenv from "dotenv";
import slugify from "slugify";
import connectDB from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// Admin account — read from .env
// ─────────────────────────────────────────────────────────────────────────────
const adminUser = {
  name:     process.env.ADMIN_NAME     || "Sofa Hi Sofa Admin",
  email:    process.env.ADMIN_EMAIL    || "admin@sofahisofa.com",
  phone:    process.env.ADMIN_PHONE    || "9999999999",
  password: process.env.ADMIN_PASSWORD || "Admin@SofaHiSofa2026",
  role:     "admin",
};

const seoUser = {
  name:     process.env.SEO_NAME     || "SEO Specialist",
  email:    process.env.SEO_EMAIL    || "seo@sofahisofa.com",
  phone:    process.env.SEO_PHONE    || "8888888888",
  password: process.env.SEO_PASSWORD || "Seo@SofaHiSofa2026",
  role:     "seo",
};

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Sofa",          description: "Handcrafted solid wood sofas — 2-seater, 3-seater, L-shape & sectionals.",   order: 1 },
  { name: "Bed",           description: "100% solid sheesham & teak beds — single, queen & king size.",               order: 2 },
  { name: "Recliner",      description: "Motorised & manual recliners with zero-gravity recline.",                    order: 3 },
  { name: "Dining Table",  description: "Solid wood dining sets for 4, 6 & 8 seaters.",                              order: 4 },
  { name: "Chair",         description: "Designer accent, dining & study chairs.",                                    order: 5 },
  { name: "Center Table",  description: "Solid wood center & coffee tables for every living space.",                  order: 6 },
  { name: "Side Table",    description: "Bedside & side tables in solid sheesham & teak.",                           order: 7 },
  { name: "Wall Clock",    description: "Handcrafted wooden wall clocks for home decor.",                             order: 8 },
  { name: "Mirror",        description: "Wooden framed decorative mirrors for bedroom & living room.",                order: 9 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Run seed
// ─────────────────────────────────────────────────────────────────────────────
const run = async () => {
  try {
    await connectDB();

    // ── Admin User ───────────────────────────────────────────────────────────
    const existing = await User.findOne({ email: adminUser.email });
    if (existing) {
      console.log(`⚠  Admin already exists: ${adminUser.email} — skipping.`);
    } else {
      await User.create(adminUser);
      console.log(`✓  Admin created: ${adminUser.email}`);
    }

    // ── SEO User ─────────────────────────────────────────────────────────────
    const existingSeo = await User.findOne({ email: seoUser.email });
    if (existingSeo) {
      console.log(`⚠  SEO user already exists: ${seoUser.email} — skipping.`);
    } else {
      await User.create(seoUser);
      console.log(`✓  SEO user created: ${seoUser.email}`);
    }

    // ── Categories ───────────────────────────────────────────────────────────
    await Category.deleteMany();
    const withSlugs = CATEGORIES.map((c) => ({
      ...c,
      slug: slugify(c.name, { lower: true, strict: true }),
    }));
    const createdCats = await Category.insertMany(withSlugs);
    console.log(`✓  ${createdCats.length} categories seeded.`);

    const catMap = {};
    createdCats.forEach((c) => { catMap[c.name] = c._id; });

    // ── Products ─────────────────────────────────────────────────────────────
    await Product.deleteMany();

    const PRODUCTS = [
      {
        name: "Kanha 3-Seater Solid Sheesham Sofa",
        sku: "SHS-SF-001",
        category: catMap["Sofa"],
        subCategory: "3-Seater Sofa",
        description: "Handcrafted solid sheesham wood frame with 40-density high-resilience foam and stain-resistant bouclé fabric. Built for everyday Indian living rooms.",
        shortDescription: "Solid sheesham wood 3-seater sofa with premium bouclé fabric upholstery.",
        material: "Kiln-Dried Sheesham Wood + Premium Bouclé Fabric",
        fabricOptions: ["Warm Mustard", "Pine Forest Green", "Oatmeal Cream", "Charcoal Slate", "Terracotta Rust"],
        dimensions: { width: 210, height: 85, depth: 88, unit: "cm" },
        warranty: "10 Year Frame Warranty",
        price: 28990, marketPrice: 45990,
        images: [
          { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80", alt: "Kanha 3-Seater Sofa in Living Room" },
          { url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80", alt: "Kanha 3-Seater Sofa Side View" },
        ],
        stock: 18, isFeatured: true, isBestSeller: true, rating: 4.8, numReviews: 124,
        metaTitle: "Kanha 3-Seater Solid Sheesham Sofa | Buy Online | Sofa Hi Sofa",
        metaDescription: "Buy the Kanha 3-Seater Solid Sheesham Sofa. 100% solid hardwood frame, 200+ fabric choices, free delivery & 10-year warranty.",
      },
      {
        name: "Raahi L-Shape Modular Sectional Sofa",
        sku: "SHS-SF-002",
        category: catMap["Sofa"],
        subCategory: "L-Shape Sectional",
        description: "A spacious L-shape modular sectional sofa with a solid sal wood chassis and reversible lounger chaise.",
        shortDescription: "Spacious L-shape modular lounger with reversible chaise.",
        material: "Kiln-Dried Sal Hardwood + Velvet Chenille",
        fabricOptions: ["Oatmeal Beige", "Smoky Charcoal", "Royal Burgundy", "Midnight Navy"],
        dimensions: { width: 285, height: 86, depth: 165, unit: "cm" },
        warranty: "10 Year Frame Warranty",
        price: 52990, marketPrice: 84990,
        images: [{ url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80", alt: "Raahi L-Shape Sectional Sofa" }],
        stock: 12, isFeatured: true, isBestSeller: true, rating: 4.7, numReviews: 89,
        metaTitle: "Raahi L-Shape Sectional Sofa | Sofa Hi Sofa",
        metaDescription: "Shop the Raahi L-Shape Sectional Sofa. Solid wood frame, reversible chaise, free installation across India.",
      },
      {
        name: "Rangeen 1-Seater Motorised Electric Recliner",
        sku: "SHS-RC-001",
        category: catMap["Recliner"],
        subCategory: "Electric Recliner",
        description: "German OKIN motorised single-seater recliner with infinite recline positions and fast USB charging. Premium Nappa leatherette finish.",
        shortDescription: "Motorised 1-seater recliner with German OKIN motor and USB charger.",
        material: "German Okin Silent Motor + Breathable Nappa Leatherette",
        fabricOptions: ["Cognac Tan Brown", "Obsidian Black", "Cream White"],
        dimensions: { width: 88, height: 104, depth: 95, unit: "cm" },
        warranty: "3 Year Motor + 5 Year Frame",
        price: 24990, marketPrice: 39990,
        images: [{ url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80", alt: "Rangeen Motorised Recliner Tan Brown" }],
        stock: 22, isFeatured: true, isBestSeller: true, isNewLaunch: true, rating: 4.9, numReviews: 67,
        metaTitle: "Rangeen Motorised Electric Recliner | Sofa Hi Sofa",
        metaDescription: "Buy Rangeen Electric Recliner with whisper-quiet German motor, zero-gravity recline, free delivery and EMI.",
      },
      {
        name: "Sattva Solid Sheesham Wood King Bed",
        sku: "SHS-BD-001",
        category: catMap["Bed"],
        subCategory: "King Size Bed",
        description: "Architectural solid Sheesham bed with fluted wood headboard and acoustic slat support for zero squeaks.",
        shortDescription: "Architectural solid Sheesham bed with fluted wood headboard.",
        material: "100% Solid Grade-A Sheesham Wood",
        fabricOptions: ["Honey Walnut Finish", "Teak Brown Finish", "Dark Espresso"],
        dimensions: { width: 195, height: 110, depth: 215, unit: "cm" },
        warranty: "10 Year Frame Warranty",
        price: 34990, marketPrice: 58990,
        images: [{ url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80", alt: "Sattva Solid Sheesham King Bed" }],
        stock: 14, isFeatured: true, isBestSeller: true, rating: 4.8, numReviews: 52,
        metaTitle: "Sattva Solid Sheesham Wood King Bed | Sofa Hi Sofa",
        metaDescription: "100% solid Sheesham king bed with lifetime termite guarantee and free room installation.",
      },
      {
        name: "Mez 6-Seater Solid Teak Dining Table Set",
        sku: "SHS-DN-001",
        category: catMap["Dining Table"],
        subCategory: "6-Seater Dining Set",
        description: "Solid teak wood dining table set with 4 ergonomic chairs and a space-saving cushioned bench.",
        shortDescription: "Solid teak 6-seater dining set with cushioned chairs and bench.",
        material: "100% Seasoned Teak Wood + Cushioned Fabric Chairs",
        fabricOptions: ["Natural Teak + Beige Cushions", "Walnut Brown + Grey Cushions"],
        dimensions: { width: 175, height: 76, depth: 90, unit: "cm" },
        warranty: "10 Year Frame Warranty",
        price: 44990, marketPrice: 69990,
        images: [{ url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80", alt: "Mez 6-Seater Solid Teak Dining Table Set" }],
        stock: 9, isFeatured: true, isBestSeller: true, rating: 4.6, numReviews: 38,
        metaTitle: "Mez 6-Seater Solid Teak Dining Table Set | Sofa Hi Sofa",
        metaDescription: "Solid teak wood dining table set with 10-year warranty and free assembly.",
      },
      {
        name: "Palki Wingback Accent Chair",
        sku: "SHS-AC-001",
        category: catMap["Chair"],
        subCategory: "Wingback Chair",
        description: "Elegant wingback accent chair with solid sheesham wood legs and premium velvet upholstery. Perfect for reading corners and master bedrooms.",
        shortDescription: "Elegant wingback accent chair with solid wood legs and velvet upholstery.",
        material: "Solid Sheesham Wood Legs + Premium Velvet",
        fabricOptions: ["Emerald Green", "Dusty Rose", "Midnight Blue", "Burnt Orange"],
        dimensions: { width: 72, height: 95, depth: 78, unit: "cm" },
        warranty: "3 Year Warranty",
        price: 14990, marketPrice: 22990,
        images: [{ url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=1000&q=80", alt: "Palki Wingback Accent Chair Emerald Green" }],
        stock: 30, isFeatured: true, isNewLaunch: true, rating: 4.7, numReviews: 29,
        metaTitle: "Palki Wingback Accent Chair | Sofa Hi Sofa",
        metaDescription: "Buy Palki Wingback Accent Chair. Solid sheesham legs, premium velvet, perfect for reading nooks.",
      },
    ];

    // insertMany bypasses pre-save hooks → add slug manually
    const productsWithSlugs = PRODUCTS.map((p) => ({
      ...p,
      slug: slugify(`${p.name}-${p.sku}`, { lower: true, strict: true }),
    }));

    await Product.insertMany(productsWithSlugs);
    console.log(`✓  ${PRODUCTS.length} products seeded.`);

    console.log("\n══════════════════════════════════════════════");
    console.log("  ✅  Seed complete! Ready to use panels.");
    console.log("──────────────────────────────────────────────");
    console.log(`  Admin Panel Login →  http://localhost:5173/admin/login`);
    console.log(`  Admin Email       →  ${adminUser.email}`);
    console.log(`  Admin Password    →  ${adminUser.password}`);
    console.log("──────────────────────────────────────────────");
    console.log(`  SEO Panel Login   →  http://localhost:5173/seo/login`);
    console.log(`  SEO Email         →  ${seoUser.email}`);
    console.log(`  SEO Password      →  ${seoUser.password}`);
    console.log("══════════════════════════════════════════════\n");

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
};

run();
