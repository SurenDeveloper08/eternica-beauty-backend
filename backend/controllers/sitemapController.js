// controllers/sitemapController.js
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const escapeXml = (unsafe) =>
  unsafe
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
      }
    });

exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || "https://eternicabeauty.com";

    // Fetch all active categories and products
    const [categories, products] = await Promise.all([
      Category.find({ isActive: true }).lean(),
      Product.find({ isActive: true }).select("slug category subCategory updatedAt createdAt seo").lean(),
    ]);

    const urls = [];

    // Static pages
    const staticRoutes = [
      { path: "/", priority: 1.0 },
      { path: "/about", priority: 0.7 },
      { path: "/contact", priority: 0.7 },
    ];

    staticRoutes.forEach((route) => {
      urls.push(`
<url>
  <loc>${escapeXml(baseUrl + route.path)}</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>${route.priority}</priority>
</url>`);
    });

    // Categories & Subcategories
    categories.forEach((cat) => {
      if (!cat.slug) return;

      // Category URL
      const catDate = cat.updatedAt || cat.createdAt || new Date();
      const catUrl = cat.seo?.canonicalUrl?.trim() || `${baseUrl}/${cat.slug}`;

      urls.push(`
<url>
  <loc>${escapeXml(catUrl)}</loc>
  <lastmod>${new Date(catDate).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>`);

      // Only include **active subcategories**
      (cat.subcategories || [])
        .filter((sub) => sub.isActive)
        .forEach((sub) => {
          if (!sub.slug) return;
          const subDate = sub.updatedAt || catDate;
          const subUrl =
            sub.seo?.canonicalUrl?.trim() || `${baseUrl}/${cat.slug}/${sub.slug}`;

          urls.push(`
<url>
  <loc>${escapeXml(subUrl)}</loc>
  <lastmod>${new Date(subDate).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>`);
        });
    });

    // Products
    products.forEach((prod) => {
      if (!prod.slug) return;

      // Check if category & subcategory exist and are active
      const category = categories.find((c) => c.slug === (typeof prod.category === "string" ? prod.category : prod.category?.slug));
      if (!category || !category.isActive) return;

      let subCategory = null;
      if (prod.subCategory) {
        subCategory = (category.subcategories || []).find(
          (s) => s.slug === (typeof prod.subCategory === "string" ? prod.subCategory : prod.subCategory?.slug)
        );
        if (prod.subCategory && (!subCategory || !subCategory.isActive)) return; // skip product if subcategory inactive
      }

      const prodDate = prod.updatedAt || prod.createdAt || new Date();
      const prodUrl =
        prod.seo?.canonicalUrl?.trim() ||
        (subCategory
          ? `${baseUrl}/${category.slug}/${subCategory.slug}/${prod.slug}`
          : `${baseUrl}/${category.slug}/${prod.slug}`);

      urls.push(`
<url>
  <loc>${escapeXml(prodUrl)}</loc>
  <lastmod>${new Date(prodDate).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.9</priority>
</url>`);
    });

    // Final XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=UTF-8");
    res.status(200).send(xml);
  } catch (error) {
    console.error("❌ Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
};