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
  isActive: {
    type: Boolean,
    default: true 
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Poster = mongoose.model('Poster', posterSchema);
module.exports = Poster;
