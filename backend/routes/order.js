const express = require('express');
const multer = require('multer');
const path = require('path')

const { createOrder,
    getAllOrders,
    deleteOrder, } = require('../controllers/orderController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');


// router.route('/order/new').post(isAuthenticatedUser,newOrder);
router.route('/order').post(
    // isAuthenticatedUser,
    createOrder);
router.route('/admin/order').get(
    // isAuthenticatedUser,
    getAllOrders);
// router.route('/order/:id').get(isAuthenticatedUser,getSingleOrder);
router.route('/order/:id').delete(
    // isAuthenticatedUser, 
    deleteOrder);


module.exports = router;