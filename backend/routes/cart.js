const express = require('express');
const { addToCart, getCartQty, getCart, updateCartQuantity,removeFromCart, getSingleCartItem, mergeGuestCart, validateCart } = require('../controllers/cartController');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');

router.route('/cart/add').post(isAuthenticatedUser, addToCart);
router.route('/cart/merge').post(isAuthenticatedUser, mergeGuestCart);
router.route('/cart/qty/:slug').get(isAuthenticatedUser, getCartQty);
router.route('/cart/validate').get(isAuthenticatedUser, validateCart);
router.route('/cart/guestvalidate').post(validateCart);
router.route('/cart/get').get(isAuthenticatedUser, getCart); //used
router.route('/cart/get').post( getCart); //used
router.route('/cart/:slug').get(isAuthenticatedUser, getCart);
router.route('/cart/update').post(isAuthenticatedUser, updateCartQuantity);
router.route('/cart/:slug').delete(isAuthenticatedUser, removeFromCart);

module.exports = router;