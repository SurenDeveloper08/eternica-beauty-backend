const express = require('express');
const { getCountry, getCity } = require('../controllers/gccCountryController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

router.route('/gcc').get(getCountry);
router.route('/gcc/:code').post(getCity);

module.exports = router;
