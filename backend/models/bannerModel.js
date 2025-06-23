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
  link: {
    type: String,
    required: true
  },
  sortOrder: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const router = mongoose.model('Banner', bannerSchema);
module.exports = router;
