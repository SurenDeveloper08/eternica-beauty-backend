const Seo = require('../models/seoModel');
const catchAsyncError = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');

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

// Create or Update SEO for a Page
exports.upsertSeo = async (req, res) => {
  try {
    const { page, metaTitle, metaDescription, metaKeywords, canonicalUrl } = req.body;

    if (!page || !metaTitle || !metaDescription)
      return res.status(400).json({ success: false, message: "Missing required SEO fields" });

    const updated = await Seo.findOneAndUpdate(
      { page },
      { page, metaTitle, metaDescription, metaKeywords, canonicalUrl },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
