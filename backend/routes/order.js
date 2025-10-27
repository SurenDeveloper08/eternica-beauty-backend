const express = require('express');
const multer = require('multer');
const path = require('path')

const { newOrder, createOrder, getAllOrder, getMyOrders, getOrderById, getSingleOrder, myOrders, orders, updateOrder, deleteOrder } = require('../controllers/orderController');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');


const upload = multer({storage: multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join( __dirname,'..' , 'uploads/invoices' ) )
    },
    filename: function(req, file, cb ) {
        cb(null, file.originalname)
    }
}) })
// router.route('/order/new').post(isAuthenticatedUser,newOrder);
router.route('/order/create').post(isAuthenticatedUser,createOrder);
router.route('/myorders/get').get(isAuthenticatedUser,getMyOrders);
// router.route('/order/:id').get(isAuthenticatedUser,getSingleOrder);
router.route('/order/:id').get(isAuthenticatedUser,getOrderById);
router.route('/myorders').get(isAuthenticatedUser,myOrders);

//Admin Routes
router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles('admin'), orders)
router.route('/admin/orders/:id/status').post(isAuthenticatedUser, authorizeRoles('admin'), upload.single('invoice'), updateOrder);
router.route('/admin/order/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
                        .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder)

router.route('/admin/orders/get').get(isAuthenticatedUser, authorizeRoles('admin'), getAllOrder)

// user
router.route('/checkout').post(
    newOrder);

module.exports = router;