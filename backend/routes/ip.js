const express = require('express');
const { getCountry, getUserCountry } = require('../controllers/ipController');
const router = express.Router();

router.route('/location/country').get(getCountry);
router.get('/get-country', getUserCountry);
module.exports = router;
