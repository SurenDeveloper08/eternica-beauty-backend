const mongoose = require('mongoose');

const saesonSchema = new mongoose.Schema({
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
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const router = mongoose.model('Season', saesonSchema);
module.exports = router;
