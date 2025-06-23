const express = require('express');
const { newOrder, createOrder, getAllOrder, getMyOrders, getOrderById, getSingleOrder, myOrders, orders, updateOrder, deleteOrder } = require('../controllers/orderController');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');

router.route('/order/new').post(isAuthenticatedUser,newOrder);
router.route('/order/create').post(isAuthenticatedUser,createOrder);
router.route('/myorders/get').get(isAuthenticatedUser,getMyOrders);
// router.route('/order/:id').get(isAuthenticatedUser,getSingleOrder);
router.route('/order/:id').get(isAuthenticatedUser,getOrderById);
router.route('/myorders').get(isAuthenticatedUser,myOrders);

//Admin Routes
router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles('admin'), orders)
router.route('/admin/order/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
                        .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder)

router.route('/admin/orders/get').get(isAuthenticatedUser, authorizeRoles('admin'), getAllOrder)

module.exports = router;