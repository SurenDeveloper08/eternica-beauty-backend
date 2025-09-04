const catchAsyncError = require('../middlewares/catchAsyncError')
const getCountryFromIP = require('../utils/getCountryFromIP');
const axios = require("axios");
const geoip = require('geoip-lite');

const countryMap = {
  ae: 'uae',
  sa: 'saudi',
  qa: 'qatar',
  kw: 'kuwait',
  om: 'oman',
  bh: 'bahrain'
};

exports.getCountry = catchAsyncError(async (req, res, next) => {
  try {
    let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;
    //var ip = "207.97.227.239";
    // Normalize IPv6 mapped IPv4
    if (ip && ip.startsWith("::ffff:")) {
      ip = ip.split("::ffff:")[1];
    }

    const countryCode = getCountryFromIP(ip); // Your existing function

    if (!countryCode) {
      return res.status(404).json({
        success: false,
        message: "Country could not be determined from IP address",
      });
    }

    // GCC country codes (ISO2)
    const gccCountries = ["AE", "SA", "KW", "OM", "QA", "BH"];

    let currency = "USD"; // default
    let countryName = "";

    if (gccCountries.includes(countryCode)) {
      try {
        // Call countriesnow.space API
        const currencyRes = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/currency",
          { iso2: countryCode }
        );

        if (!currencyRes.data.error) {
          currency = currencyRes.data.data.currency;
          countryName = currencyRes.data.data.name;
        }
      } catch (err) {
        console.error("Currency API error:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      countryCode,
      countryName: countryName || countryCode,
      currency,
    });
  } catch (error) {
    console.error("GeoIP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while detecting IP location",
    });
  }
});

exports.getUserCountry = async (req, res) => {

  try {
    // Get client IP
    let ip = req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip;
    //var ip = "207.97.227.239";
    // Remove IPv6 prefix
    if (ip?.startsWith('::ffff:')) ip = ip.split('::ffff:')[1];

    // Fallback for local testing
    if (!ip || ip === '127.0.0.1') ip = '207.97.227.239';

    var geo = geoip.lookup(ip);
    let countryCode = 'AE';
    countryCode = geo?.country || 'AE'; // Default UAE
    countryCode = countryCode?.toLowerCase();
    const country = countryMap[countryCode] || 'uae';

    res.status(200).json({
      success: true,
      country,
      countryCode
    });
  } catch (err) {
    console.error('GeoIP Error:', err.message);
    res.status(500).json({
      success: false,
      country: 'uae',
      message: 'Failed to detect country'
    });
  }
};
