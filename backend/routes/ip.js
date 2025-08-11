const express = require('express');
const { getCountry } = require('../controllers/ipController');
const router = express.Router();

router.route('/location/country').get(getCountry);

module.exports = router;
