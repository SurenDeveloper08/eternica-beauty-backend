const express = require('express');
const { getProductsByCategory, getProductsBySubCategory, searchProducts, getProductsByrelCategory, getProducts, updateHighlights, getHomePageHighlights, newProduct, getSingleProduct, updateProduct, deleteProduct, createReview, getReviews, deleteReview, getAdminProducts } = require('../controllers/productController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const multer = require('multer');
const path = require('path')

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '..', 'uploads/product'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})

router.route('/products').get(getProducts);
router.route('/product/:id').get(getSingleProduct);
router.route('/products/search').get(searchProducts);
router.route('/admin/products/highlight/:id').put(updateHighlights);
router.route('/products/homepage-products').get(getHomePageHighlights);




router.route('/review').put(isAuthenticatedUser, createReview)
// router.route('/products/category/:cid').get(getProductsByCategory);
router.route('/products/category').get(getProductsByCategory);
router.route('/products/subcategory').get(getProductsBySubCategory);
router.route('/products/related').get(getProductsByrelCategory);
//Admin routes
router.route('/admin/product/new').post(upload.array('images'), newProduct);
router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);
router.route('/admin/product/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);
router.route('/admin/product/:id').put(isAuthenticatedUser, authorizeRoles('admin'), upload.array('images'), updateProduct);
router.route('/admin/reviews').get(isAuthenticatedUser, authorizeRoles('admin'), getReviews)
router.route('/admin/review').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteReview)


module.exports = router;