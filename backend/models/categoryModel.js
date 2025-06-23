const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  subcategories: {
    type: [subCategorySchema],
    default: []
  },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
