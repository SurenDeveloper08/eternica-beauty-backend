const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
  canonicalUrl: String,
}, { _id: false });

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  seo: seoSchema
}, {
  timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);
