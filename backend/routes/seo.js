const express = require('express');
const { getSeoByPage, upsertSeo, seo } = require('../controllers/seoController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')
const multer = require('multer');
const upload = multer();

// router.route('/seo').get(seo);
// router.route('/seobypage').get(isAuthenticatedUser, authorizeRoles('admin'), getSeoByPage);
router.route('/admin/seo').get(isAuthenticatedUser, authorizeRoles('admin'), getSeoByPage);
router.route('/admin/seo').post(isAuthenticatedUser, upload.none(), authorizeRoles('admin'), upsertSeo);
router.route('/seo').get(getSeoByPage);
module.exports = router;
