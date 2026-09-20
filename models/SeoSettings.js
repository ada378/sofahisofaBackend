import mongoose from "mongoose";

const seoSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "global" },
    siteName: { type: String, default: "Sofa Hi Sofa" },
    title: { type: String, default: "Handcrafted Luxury Sofas & Bespoke Living Furniture" },
    description: { type: String, maxlength: 160, default: "Shop handcrafted luxury sofas, recliners, beds & dining sets direct from factory. 10-Year Warranty, 200+ custom fabrics, 0% EMI & Free Pan-India Delivery." },
    canonicalUrl: { type: String, default: "https://www.sofahisofa.com/" },
    ogImage: { type: String, default: "" },
    keywords: [String],
    robotsMeta: { type: String, default: "index, follow" },
    // Organization Schema (JSON-LD)
    organizationName: { type: String, default: "Sofa Hi Sofa" },
    telephone: { type: String, default: "+919810926762" },
    address: {
      streetAddress: { type: String, default: "Khasra Number 491 - 492 Kisan path Vill : Churahya" },
      addressLocality: { type: String, default: "Lucknow" },
      addressRegion: { type: String, default: "Uttar Pradesh" },
      postalCode: { type: String, default: "226501" },
      addressCountry: { type: String, default: "IN" },
    },
    // Social profiles
    socialLinks: {
      instagram: String,
      facebook: String,
      youtube: String,
      twitter: String,
    },
    // Google / Verification Tags
    googleSiteVerification: String,
    googleAnalyticsId: String,
    // Sitemap settings
    sitemapEnabled: { type: Boolean, default: true },
    robotsTxtCustom: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("SeoSettings", seoSettingsSchema);
