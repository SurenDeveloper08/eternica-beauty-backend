const express = require('express');
const {
  createProduct,
  getAdminProducts,
  getAdminProduct,
  deleteProduct,
  updateProduct,
  toggleProductActive,
  getAdminActiveProducts,
  getActiveCategoryProducts,
  getActiveSearchProducts,
  getProduct,
  getActiveRelatedProducts,

} = require('../controllers/productController');
const router = express.Router();
const multer = require('multer');
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads/product'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName
      .trim()
      .replace(/\s+/g, '_')        // spaces to underscores
      .replace(/[^a-zA-Z0-9_-]/g, ''); // only keep safe chars

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const finalName = `${safeName}_${uniqueSuffix}${ext}`;
    cb(null, finalName);
  },
});

// Create the multer upload instance
const upload = multer({ storage });

router.route('/admin/product/new').post(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images' },
  ]),
  createProduct);

router.route('/admin/products').get(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  getAdminProducts);

router.route('/admin/product/:productId').put(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images' },
  ]),
  updateProduct);

router.route('/admin/product/:productId').get(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  getAdminProduct);

router.route('/admin/active/products').get(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  getAdminActiveProducts);

router.route('/admin/product/:productId').delete(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  deleteProduct);

router.route('/admin/product/status/:productId').put(
  // isAuthenticatedUser, authorizeRoles('admin'),
  toggleProductActive);

//user
router.route('/product/:productId').get(
  getProduct);
//user
router.route('/products').get(
  getActiveCategoryProducts);
  //user
  router.route('/products/by-category').get(
  getActiveRelatedProducts);

router.route('/products/search').get(getActiveSearchProducts);
module.exports = router;