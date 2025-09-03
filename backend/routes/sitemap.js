// routes/sitemapRoutes.js
const express = require('express');
const router = express.Router();
const { generateSitemapIndex, generateCountrySitemap} = require('../controllers/sitemapController');

router.get('/sitemap.xml', generateSitemapIndex);
router.get('/sitemap-:country.xml', generateCountrySitemap);
module.exports = router;

