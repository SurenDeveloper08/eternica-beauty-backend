const catchAsyncError = require('../middlewares/catchAsyncError')
const getCountryFromIP = require('../utils/getCountryFromIP');

exports.getCountry = catchAsyncError(async (req, res, next) => {
  try {
    let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;

    // Normalize IPv6 mapped IPv4
    if (ip && ip.startsWith('::ffff:')) {
      ip = ip.split('::ffff:')[1];
    }

    const countryCode = getCountryFromIP(ip);

    if (!countryCode) {
      return res.status(404).json({
        success: false,
        message: 'Country could not be determined from IP address',
      });
    }

    return res.status(200).json({
      success: true,
      countryCode,
    });

  } catch (error) {
    console.error('GeoIP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while detecting IP location',
    });
  }
});




