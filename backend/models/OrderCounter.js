const mongoose = require('mongoose');

const orderCounterSchema = new mongoose.Schema({
  date: {
    type: String, // Format: 'DDMMYYYY'
    required: true,
    unique: true
  },
  count: {
    type: Number,
    required: true,
    default: 1
  }
});

module.exports = mongoose.model('OrderCounter', orderCounterSchema);
