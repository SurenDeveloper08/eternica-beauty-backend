const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

exports.dashboardStats = catchAsyncError(async (req, res, next) => {
    try {

        const totalUsers = await User.countDocuments();

        const totalOrders = await Order.countDocuments();

        const revenueResult = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const totalRevenue = revenueResult[0]?.total || 0;

        const totalProducts = await Product.countDocuments();

        res.json({
            success: true,
            data: {
                totalUsers,
                totalOrders,
                totalRevenue,
                totalProducts
            }
        });

    } catch (err) {
        console.error('[Dashboard Stats Error]', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
})