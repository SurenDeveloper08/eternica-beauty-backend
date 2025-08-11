const Country = require('../models/GccCountry');
const catchAsyncError = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const gccCountries = require('../data/gccCountries');
const axios = require('axios');


exports.getCountry = async (req, res) => {
  try {
    const result = await axios.get('https://countriesnow.space/api/v0.1/countries/states', {
      timeout: 10000 // optional: timeout after 10 seconds
    });
  
    if (result.data.error === false) {
      return res.status(200).json({
        success: true,
        message: 'List of GCC countries with cities',
        data: result.data
      });
    } else {
      console.warn('Countries API responded with error:', result.data.msg);
      res.status(502).json({ error: true, msg: 'External API error', details: result.data.msg });
    }
  } catch (err) {
    console.error('Failed to fetch countries:', err.message);
    res.status(500).json({ error: true, msg: 'Internal server error' });
  }

};

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

exports.getCurrency = async (req, res) => {
  try {
    const { countryCode } = req.params;

    if (!countryCode) {
      return res.status(400).json({
        success: false,
        message: "Country code is required"
      });
    }

    const country = gccCountries.find(
      (c) => c.code.toUpperCase() === countryCode.toUpperCase()
    );

    if (country) {
      return res.status(200).json({
        success: true,
        currency: country.currency,
        symbol: country.symbol,
        country: country.name,
        isGCC: true,
      });
    }

    // Default to USD for non-GCC countries
    return res.status(200).json({
      success: true,
      currency: "USD",
      symbol: "$",
      country: null,
      isGCC: false,
    });
  } catch (error) {
    console.error("Error in getCurrency:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getCurrencyOptions = async (req, res) => {
  try {
    const gccWithFlags = gccCountries.map((c) => ({
      ...c,
      isGCC: true,
      flagUrl: `https://flagcdn.com/w40/${c.code.toLowerCase()}.png`
    }));

    const otherOption = {
      name: "Other Countries",
      code: "OTH",
      currency: "USD",
      symbol: "$",
      isGCC: false,
      flagUrl: "https://flagcdn.com/w40/us.png" // Default to US flag for USD
    };

    return res.status(200).json({
      success: true,
      data: [...gccWithFlags, otherOption],
    });
  } catch (error) {
    console.error("Error in getCurrencyOptions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
