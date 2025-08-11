const geoip = require('geoip-lite');

const getCountryFromIP = (ip) => {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return 'AE'; // fallback to UAE or your default

  const geo = geoip.lookup(ip);
  return geo?.country || null;
};  

module.exports = getCountryFromIP;
