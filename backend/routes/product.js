const express = require('express');
const { getProductsByCategory, getProductsBySubCategory, getAdminSingleProduct, getProductsByCFilter, getProductsBySCFilter, searchProducts, getProductsByrelCategory, getProducts, updateHighlights, getHomePageHighlights, newProduct, getSingleProduct, updateProduct, deleteProduct, createReview, getReviews, deleteReview, getAdminProducts } = require('../controllers/productController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const multer = require('multer');
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // store files inside /uploads/product
    cb(null, path.join(__dirname, '..', 'uploads/product'));
  },
  filename: function (req, file, cb) {
    // get extension
    const ext = path.extname(file.originalname).toLowerCase();

    // get base name without extension
    const baseName = path.basename(file.originalname, ext);

    // sanitize base name (remove spaces and special characters)
    const safeName = baseName
      .trim()
      .replace(/\s+/g, '_')        // spaces to underscores
      .replace(/[^a-zA-Z0-9_-]/g, ''); // only keep safe chars

    // add timestamp to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    // final filename
    const finalName = `${safeName}_${uniqueSuffix}${ext}`;
    cb(null, finalName);
  },
});

// Create the multer upload instance
const upload = multer({ storage });


router.route('/products').get(getProducts);
router.route('/product/:slug').get(getSingleProduct); //used
router.route('/products/search').get(searchProducts); //used
router.route('/admin/products/highlight/:slug').put(updateHighlights);
router.route('/products/homepage-products').get(getHomePageHighlights);
router.route('/products/filterbycat').post(getProductsByCFilter);  //used
router.route('/products/filterbysub').post(getProductsBySCFilter); //used

router.route('/review').put(isAuthenticatedUser, createReview)
// router.route('/products/category/:cid').get(getProductsByCategory);
router.route('/products/category').get(getProductsByCategory); //used
router.route('/products/subcategory').get(getProductsBySubCategory); //used
router.route('/products/related').get(getProductsByrelCategory); //used
//Admin routes
router.route('/admin/product/new').post(isAuthenticatedUser, upload.fields([
    { name: 'productImage', maxCount: 1 },
    { name: 'files' }, // gallery images
    { name: 'variantImages' }, // variant/size-level images
]), newProduct);
router.route('/admin/product/:slug').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminSingleProduct);
router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);
router.route('/admin/product/:slug').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);
router.route('/admin/product/:slug').put(isAuthenticatedUser, authorizeRoles('admin'),  upload.fields([
    { name: 'productImage', maxCount: 1 },
    { name: 'files' }, // gallery
    { name: 'variantImages' } // variant/size
  ]), updateProduct);
router.delete('/product/:slug', isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);
router.route('/admin/reviews').get(isAuthenticatedUser, authorizeRoles('admin'), getReviews)
router.route('/admin/review').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteReview)


module.exports = router;