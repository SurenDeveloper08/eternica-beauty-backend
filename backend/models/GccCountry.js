const mongoose = require('mongoose');

const GccCountrySchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  cities: [
    {
      type: String,
      required: true
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('GccCountry', GccCountrySchema);
