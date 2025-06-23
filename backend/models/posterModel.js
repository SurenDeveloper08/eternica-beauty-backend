const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema({
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
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const router = mongoose.model('Poster', posterSchema);
module.exports = router;
