const Seo = require('../models/seoModel');
const catchAsyncError = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Blog = require('../models/blogModel');
const countryData = require('../data/countryData.json');

exports.seo = async (req, res) => {
  try {
    const { path = '/', country = 'uae', category, subcategory, product, blog } = req.query;

    if (!countryData[country]) {
      return res.status(400).json({ error: 'Invalid country' });
    }
    let seoData = {};
    if (path === '/' || path === `/${country}/`) {
      let page = 'home';
      seoData = await Seo.findOne({ page });
    } else if (path.includes('/blogs')) {
      seoData = await fetchBlogsSEO(country);
    } else if (path.includes('/blog') && blog) {
      seoData = await fetchBlogSEO(blog, country);
    } else if (product) {
      seoData = await fetchProductSEO(product, country);
    } else if (subcategory) {
      seoData = await fetchSubCategorySEO(category, subcategory, country);
    } else if (category) {
      seoData = await fetchCategorySEO(category, country);
    }

    if (!seoData) {
      seoData = {
        metaTitle: 'SPA Store – Premium Spa Products in {country}',
        metaDescription: 'Shop spa & wellness products in {city}',
        metaKeywords: 'spa, wellness, massage',
      };
    }
    const meta = mapToSEOMeta(seoData, countryData, country);
    meta.canonical = `${process.env.FRONTEND_URL}${path}`;

    meta.alternates = [
      {
        hreflang: "x-default",
        href: `${process.env.FRONTEND_URL}/uae${path.replace(/^\/[^\/]+/, '')}`
      },
      ...Object.entries(countryData).map(([key, country]) => ({
        hreflang: country.hreflang,
        href: `${process.env.FRONTEND_URL}/${key}${path.replace(/^\/[^\/]+/, '')}`
      }))
    ];

    meta.openGraph = {
      "og:title": meta.title,
      "og:description": meta.description,
      "og:image": seoData?.ogImage || `https://spastore.me/static/media/logo.f33ca0853c59392b6689.png`,
      "og:url": meta.canonical,
      "og:type": seoData.ogType || "website"
    };

    meta.twitter = {
      "twitter:card": "summary_large_image",
      "twitter:title": meta.title,
      "twitter:description": meta.description,
      "twitter:image": seoData?.ogImage || `https://spastore.me/static/media/logo.f33ca0853c59392b6689.png`,
    };

    return res.json(meta);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch SEO' });
  }
}

// Get SEO by Page Path
exports.getSeoByPage = async (req, res) => {
  try {
    const { page } = req.query;
    if (!page) return res.status(400).json({ success: false, message: "Page path is required" });

    const seo = await Seo.findOne({ page });
    res.status(200).json({ success: true, data: seo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// controllers/seoController.js
exports.upsertSeo = async (req, res) => {
  try {
    const { page, metaTitle, metaDescription, metaKeywords, canonicalUrl } = req.body;

    if (!page || !metaTitle || !metaDescription) {
      return res.status(400).json({
        success: false,
        message: "Missing required SEO fields",
      });
    }

    const updated = await Seo.findOneAndUpdate(
      { page },
      { page, metaTitle, metaDescription, metaKeywords, canonicalUrl },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Upsert SEO Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

function capitalizeWords(str) {
  if (!str) return '';
  return str
    .split(',')          // split multiple cities
    .map(s =>
      s
        .trim()
        .split(' ')      // split words in a city
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    )
    .join(', ');
}

// Map to simplified SEO format
function mapToSEOMeta(doc, countryData, country) {
  const citiesStr = capitalizeWords(countryData[country].cities.join(', '));
  const countryName = countryData[country].name;

  return {
    title: String(doc.metaTitle)
      .replace(/{city}/g, citiesStr)
      .replace(/{country}/g, countryName),
    description: String(doc.metaDescription)
      .replace(/{city}/g, citiesStr)
      .replace(/{country}/g, countryName),
    keywords: String(doc.metaKeywords)
      .replace(/{city}/g, citiesStr)
      .replace(/{country}/g, countryName),
  };
}

async function fetchCategorySEO(categorySlug, country) {
  // Use lean() to return plain JS object (faster than Mongoose document)
  const category = await Category.findOne({ slug: categorySlug });

  // Fallback defaults
  const name = category?.name || categorySlug;

  return {
    metaTitle: category?.seo?.metaTitle || `${name} - {country}`,
    metaDescription: category?.seo?.metaDescription || `Explore ${name} products available in {city}`,
    metaKeywords: category?.seo?.metaKeywords || `${name}, {country} {city}`,
    canonicalUrl: category?.seo?.canonicalUrl || `/category/${categorySlug}`,
    ogImage: category?.image,
    ogType: "website"
  };
}

async function fetchSubCategorySEO(categorySlug, subcategorySlug, country = '', city = '') {
  const category = await Category.findOne({ slug: categorySlug })
    .select('name subcategories.seo subcategories.name subcategories.slug')
    .lean();

  const sub = category?.subcategories.find(s => s.slug === subcategorySlug);
  const name = sub?.name || subcategorySlug;

  return {
    metaTitle: sub?.seo?.metaTitle || `${name} - {country}`,
    metaDescription: sub?.seo?.metaDescription || `Explore ${name} products available in {city}`,
    metaKeywords: sub?.seo?.metaKeywords || `${name} {country}, ${name} {city}`,
    canonicalUrl: sub?.seo?.canonicalUrl || `/category/${categorySlug}/${subcategorySlug}`,
    ogImage: sub?.image,
    ogType: "website"
  };
}

async function fetchProductSEO(productSlug, country) {
  const product = await Product.findOne({ slug: productSlug });
  const name = product?.productName || productSlug;

  return {
    metaTitle: product?.seo?.metaTitle || `${name} - {country}`,
    metaDescription: product?.seo?.metaDescription || `Check out ${name} available in {city}`,
    metaKeywords: product?.seo?.metaKeywords || `${name}, {country}, {city}`,
    canonicalUrl: product?.seo?.canonicalUrl || `/product/${productSlug}`,
    ogImage: product?.image,
    ogType: "product"
  };
}

async function fetchBlogsSEO(country) {
  return {
    title: 'Spa Store - Blogs',
    description: 'All spa articles',
    keywords: 'spa, wellness, blog',
    canonicalUrl: `/blogs`,
    ogImage: `https://spastore.me/static/media/logo.f33ca0853c59392b6689.png`,
    ogType: "website"
  };
}

async function fetchBlogSEO(blogSlug, country) {
  const blog = await Blog.findOne({ slug: blogSlug });
  return {
    title: blog?.metaTitle || blog?.title,
    description: blog?.metaDescription,
    keywords: blog?.metaKeywords,
    canonicalUrl: blog?.canonicalUrl || `/blog/${blog.slug}`,
    ogImage: blog?.image,
    ogType: "article"
  };
}
