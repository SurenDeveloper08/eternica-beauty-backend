const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  sortOrder: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const router = mongoose.model('Banner', bannerSchema);
module.exports = router;
