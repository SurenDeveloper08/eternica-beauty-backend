const express = require('express');
const { getCountry, getCity, getCurrency, getCurrencyOptions } = require('../controllers/CountryController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

router.route('/gcc').get(getCountry);
router.route('/gcc/:code').post(getCity);
router.route('/currency/:countryCode').post(getCurrency);
router.route('/currencies').get(getCurrencyOptions);
module.exports = router;
