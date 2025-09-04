// controllers/sitemapController.js
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const countries = [
  { code: 'uae', name: 'uae', lang: 'en-ae' },
  { code: 'saudi', name: 'saudi', lang: 'en-sa' },
  { code: 'qatar', name: 'qatar', lang: 'en-qa' },
  { code: 'kuwait', name: 'kuwait', lang: 'en-kw' },
  { code: 'oman', name: 'oman', lang: 'en-om' },
  { code: 'bahrain', name: 'bahrain', lang: 'en-bh' },
];

// XML escape helper
const escapeXml = (str) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// ✅ Sitemap index
exports.generateSitemapIndex = (req, res) => {
  try {
    const baseUrl = process.env.BACKEND_URL || 'https://spastore.me';

    const sitemaps = countries.map(c => `
      <sitemap>
        <loc>${baseUrl}/sitemap-${c.name}.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>
    `.trim());

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemaps.join('\n')}
    </sitemapindex>`;

    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.status(200).send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating sitemap index');
  }
};

// Generate country-specific sitemap
exports.generateCountrySitemap = async (req, res) => {
  try {
    const baseUrl = (process.env.FRONTEND_URL || 'https://spastore.me').replace(/\/+$/, ''); // Remove trailing slash
    const countryName = req.params.country;

    const country = countries.find(c => c.name === countryName);
    if (!country) return res.status(404).send('Country not supported');

    // Populate category and subcategory slugs for product URLs
    const [categories, products] = await Promise.all([
      Category.find({ isActive: true }).lean(),
      Product.find({ isActive: true })
        .populate('category', 'slug')
        .populate('subCategory', 'slug')
        .select('slug updatedAt createdAt seo category subCategory')
        .lean()
    ]);

    const urls = [];

    // Home page
    urls.push(`
<url>
  <loc>${escapeXml(`${baseUrl}/${country.name}/`)}</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>`.trim());

    // Categories & Subcategories
    categories.forEach(cat => {
      if (!cat.slug) return; // skip if slug missing
      const catDate = cat.updatedAt || cat.createdAt || new Date();
      const catUrl = cat.seo?.canonicalUrl?.trim() || `${baseUrl}/${country.name}/${cat.slug}`;
      urls.push(`
<url>
  <loc>${escapeXml(catUrl)}</loc>
  <lastmod>${new Date(catDate).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>`.trim());

      (cat.subcategories || []).forEach(sub => {
        if (!sub.slug) return;
        const subDate = sub.updatedAt || catDate;
        const subUrl = sub.seo?.canonicalUrl?.trim() || `${baseUrl}/${country.name}/${cat.slug}/${sub.slug}`;
        urls.push(`
<url>
  <loc>${escapeXml(subUrl)}</loc>
  <lastmod>${new Date(subDate).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>`.trim());
      });
    });

    // Products
    products.forEach(prod => {
      if (!prod.slug) return;

      const prodDate = prod.updatedAt || prod.createdAt || new Date();
      const categorySlug = prod.category?.slug || prod.category;
      const subCategorySlug = prod.subCategory?.slug || prod.subCategory;

      // Skip if category/subcategory missing
      if (!categorySlug || !subCategorySlug) return;

      const prodUrl = prod.seo?.canonicalUrl?.trim() || `${baseUrl}/${country.name}/${categorySlug}/${subCategorySlug}/${prod.slug}`;

      urls.push(`
<url>
  <loc>${escapeXml(prodUrl)}</loc>
  <lastmod>${new Date(prodDate).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>`.trim());
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.status(200).send(xml);

  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
};
