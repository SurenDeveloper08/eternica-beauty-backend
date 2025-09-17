const express = require('express');
const { getSeoByPage, upsertSeo, seo } = require('../controllers/seoController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')
 const countryData = {
    uae: { name: "UAE", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
    saudi: { name: "Saudi Arabia", cities: ["Riyadh", "Jeddah", "Dammam"] },
    kuwait: { name: "Kuwait", cities: ["Kuwait City", "Al Ahmadi"] },
    qatar: { name: "Qatar", cities: ["Doha", "Al Rayyan"] },
    oman: { name: "Oman", cities: ["Muscat", "Salalah"] },
    bahrain: { name: "Bahrain", cities: ["Manama", "Riffa"] },
};

router.route('/seo').get(seo);
router.route('/seobypage').get(isAuthenticatedUser, authorizeRoles('admin'), getSeoByPage);
router.route('/seo').post(isAuthenticatedUser, authorizeRoles('admin'), upsertSeo);

module.exports = router;
