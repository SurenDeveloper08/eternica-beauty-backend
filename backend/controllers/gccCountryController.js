const Country = require('../models/GccCountry');
const catchAsyncError = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const gccData = require('../data/gccData');

// Get SEO by Page Path
exports.getCountry = async (req, res) => {
    return res.status(200).json({
    success: true,
    message: 'List of GCC countries with cities',
    data: gccData
  });
};
  
// controllers/seoController.js
exports.getCity = async (req, res) => {
 const code = req.params.code.toUpperCase();
  const country = gccData.find(item => item.code === code);

  if (!country) {
    return res.status(404).json({
      success: false,
      message: `Country with code '${code}' not found`
    });
  }

  return res.status(200).json({
    success: true,
    message: `Cities in ${country.country}`,
    data: country
  });
};

