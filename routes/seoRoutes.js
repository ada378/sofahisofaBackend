import express from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Blog from "../models/Blog.js";
import SeoSettings from "../models/SeoSettings.js";

const router = express.Router();
const SITE_URL = process.env.SITE_URL || "https://www.thesofahisofa.com";

// GET /sitemap.xml (or any subpath sitemap.xml) — dynamically built from live catalog & content
router.get(["/sitemap.xml", "*/sitemap.xml"], async (req, res) => {
  try {
    const [products, categories, blogs] = await Promise.all([
      Product.find().select("slug images name updatedAt").lean(),
      Category.find().select("slug updatedAt").lean(),
      Blog.find({ status: "published" }).select("slug updatedAt").lean(),
    ]);

    const staticUrls = [
      { loc: "", priority: "1.0", changefreq: "daily" },
      { loc: "collections", priority: "0.9", changefreq: "daily" },
      { loc: "blog", priority: "0.8", changefreq: "daily" },
      { loc: "contact", priority: "0.7", changefreq: "monthly" },
      { loc: "wishlist", priority: "0.5", changefreq: "monthly" },
    ];

    let urls = staticUrls.map(
      (u) =>
        `  <url>\n    <loc>${SITE_URL}${u.loc ? `/${u.loc}` : "/"}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    );

    urls = urls.concat(
      categories.map(
        (c) =>
          `  <url>\n    <loc>${SITE_URL}/collections/${c.slug}</loc>\n    <lastmod>${(c.updatedAt ? new Date(c.updatedAt) : new Date()).toISOString().split("T")[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`
      )
    );

    urls = urls.concat(
      products.map((p) => {
        const lastmod = (p.updatedAt ? new Date(p.updatedAt) : new Date()).toISOString().split("T")[0];
        const imgUrl = p.images && p.images.length > 0 ? (typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.url) : null;
        const imgTag = imgUrl
          ? `\n    <image:image>\n      <image:loc>${imgUrl.replace(/&/g, "&amp;")}</image:loc>\n      <image:title>${(p.name || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</image:title>\n    </image:image>`
          : "";
        return `  <url>\n    <loc>${SITE_URL}/product/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>${imgTag}\n  </url>`;
      })
    );

    if (blogs && blogs.length > 0) {
      urls = urls.concat(
        blogs.map(
          (b) =>
            `  <url>\n    <loc>${SITE_URL}/blog/${b.slug}</loc>\n    <lastmod>${(b.updatedAt ? new Date(b.updatedAt) : new Date()).toISOString().split("T")[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
        )
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>`;

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600"); // cache for 1 hour
    res.send(xml);
  } catch (err) {
    console.error("Error generating sitemap:", err);
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
