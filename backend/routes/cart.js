const express = require('express');
const { addToCart, getCart, updateCartQuantity,removeFromCart, getSingleCartItem } = require('../controllers/cartController');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');

router.route('/cart/add').post(isAuthenticatedUser, addToCart); 
router.route('/cart/get').get(isAuthenticatedUser, getCart);
router.route('/cart/:productId').get(isAuthenticatedUser, getCart);
router.route('/cart/update').post(isAuthenticatedUser, updateCartQuantity);
router.route('/cart/:productId').delete(isAuthenticatedUser, removeFromCart);


module.exports = router;