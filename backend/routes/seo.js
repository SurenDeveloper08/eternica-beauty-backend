const express = require('express');
const { getSeoByPage, upsertSeo } = require('../controllers/seoController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

router.route('/').post(getSeoByPage);
router.route('/').post(isAuthenticatedUser, authorizeRoles('admin'), upsertSeo);

module.exports = router;
