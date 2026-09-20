import express from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import SeoSettings from "../models/SeoSettings.js";

const router = express.Router();
const SITE_URL = process.env.SITE_URL || "https://www.sofahisofa.com";

// GET /sitemap.xml — dynamically built from live catalog
router.get("/sitemap.xml", async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find().select("slug updatedAt"),
      Category.find().select("slug updatedAt"),
    ]);

    const staticUrls = [
      { loc: "", priority: "1.0", changefreq: "daily" },
      { loc: "collections/all", priority: "0.9", changefreq: "daily" },
      { loc: "about-us", priority: "0.6", changefreq: "monthly" },
      { loc: "contact", priority: "0.6", changefreq: "monthly" },
      { loc: "stores", priority: "0.7", changefreq: "monthly" },
      { loc: "shipping-policy", priority: "0.4", changefreq: "monthly" },
      { loc: "return-policy", priority: "0.4", changefreq: "monthly" },
    ];

    let urls = staticUrls.map(
      (u) =>
        `  <url>\n    <loc>${SITE_URL}/${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    );

    urls = urls.concat(
      categories.map(
        (c) =>
          `  <url>\n    <loc>${SITE_URL}/collections/${c.slug}</loc>\n    <lastmod>${c.updatedAt.toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`
      )
    );

    urls = urls.concat(
      products.map(
        (p) =>
          `  <url>\n    <loc>${SITE_URL}/product/${p.slug}</loc>\n    <lastmod>${p.updatedAt.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
      )
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600"); // cache for 1 hour
    res.send(xml);
  } catch (err) {
    res.status(500).send("Error generating sitemap");
  }
});

// GET /robots.txt — uses custom text from DB if set, else default
router.get("/robots.txt", async (req, res) => {
  try {
    const settings = await SeoSettings.findOne({ key: "global" }).select("robotsTxtCustom sitemapEnabled").lean();

    const customRobots = settings?.robotsTxtCustom?.trim();
    const sitemapLine = settings?.sitemapEnabled !== false ? `\nSitemap: ${SITE_URL}/sitemap.xml` : "";

    const defaultRobots = `User-agent: *
Allow: /
Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /admin
Disallow: /api/${sitemapLine}`;

    res.type("text/plain");
    res.header("Cache-Control", "public, max-age=86400"); // cache 24h
    res.send(customRobots || defaultRobots);
  } catch {
    res.type("text/plain");
    res.send(`User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /admin\n\nSitemap: ${SITE_URL}/sitemap.xml`);
  }
});

export default router;
