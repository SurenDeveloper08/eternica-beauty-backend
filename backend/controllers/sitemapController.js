// controllers/sitemapController.js
const Product = require('../models/productModel');
const Category = require('../models/categoryModel'); // optional if you want categories

exports.generateSitemaps = async (req, res) => {
    try {

        const baseUrl = process.env.FRONTEND_URL || 'https://spastore.me';

        // Fetch products (only active)
        const products = await Product.find({ isActive: true }).select('slug updatedAt').lean();
        const categories = await Category.find({ isActive: true }).lean();

        let urls = [];

        // ✅ Homepage
        urls.push(`<url><loc>${baseUrl}/</loc><priority>1.0</priority></url>`);

        // ✅ Categories
        categories.forEach(cat => {
            urls.push(`<url><loc>${baseUrl}/products/${cat.slug}</loc></url>`);
            cat.subcategories.forEach(sub => {
                urls.push(`<url><loc>${baseUrl}/products/${cat.slug}/${sub.slug}</loc></url>`);
            });
        });

        // ✅ Products
        products.forEach(prod => {
            urls.push(
                `<url>
          <loc>${baseUrl}/product/${prod.slug}</loc>
          <lastmod>${new Date(prod.updatedAt).toISOString()}</lastmod>
          <priority>0.8</priority>
        </url>`
            );
        });

        // ✅ Build final XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            urls.join('\n') +
            `\n</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error('❌ Error generating sitemap:', err);
        res.status(500).send('Error generating sitemap');
    }
};

const escapeXml = (unsafe) => {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

exports.generateSitemap = async (req, res) => {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'https://spastore.me';

        // ✅ Fetch categories and products
        const [products, categories] = await Promise.all([
            Product.find({ isActive: true })
                .select('slug updatedAt createdAt seo')
                .lean(),
            Category.find({ isActive: true }).lean()
        ]);

        const urls = [];

        // ✅ Homepage
        urls.push(`
      <url>
        <loc>${escapeXml(baseUrl + '/')}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `.trim());

        // ✅ Categories
        categories.forEach(cat => {
            const catDate = cat.updatedAt || cat.createdAt || new Date();
            const catUrl = cat.seo?.canonicalUrl?.trim() || `${baseUrl}/products/${cat.slug}`;
            urls.push(`
        <url>
          <loc>${escapeXml(catUrl)}</loc>
          <lastmod>${new Date(catDate).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>
      `.trim());

            // ✅ Subcategories
            (cat.subcategories || []).forEach(sub => {
                const subDate = sub.updatedAt || catDate;
                const subUrl = sub.seo?.canonicalUrl?.trim() || `${baseUrl}/products/${cat.slug}/${sub.slug}`;
               urls.push(`
          <url>
            <loc>${escapeXml(subUrl)}</loc>
            <lastmod>${new Date(subDate).toISOString()}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>
        `.trim());
            });
        });

        // ✅ Products
        products.forEach(prod => {
            const prodDate = prod.updatedAt || prod.createdAt || new Date();
            const prodUrl = prod.seo?.canonicalUrl?.trim() || `${baseUrl}/product/${prod.slug}`;
            urls.push(`
        <url>
          <loc>${escapeXml(prodUrl)}</loc>
          <lastmod>${new Date(prodDate).toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `.trim());
        });

        // ✅ Final XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            urls.join('\n') +
            `\n</urlset>`;

        res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
        res.status(200).send(xml);

    } catch (err) {
        console.error('❌ Error generating sitemap:', err);
        res.status(500).send('Error generating sitemap');
    }
};

