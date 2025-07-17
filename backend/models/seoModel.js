const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true }, // e.g., 'home'
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  metaKeywords: { type: String },
  canonicalUrl: { type: String }
}, { timestamps: true });
                                                                                                                                                                                                                 0
module.exports = mongoose.model('Seo', seoSchema);
