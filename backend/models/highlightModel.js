// models/ProductHighlight.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductHighlightSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  category: {
    type: String,
    enum: ['featured', 'best_deal', 'popular'],
    required: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ProductHighlight', ProductHighlightSchema);
