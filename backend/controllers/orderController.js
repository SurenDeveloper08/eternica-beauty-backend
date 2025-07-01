const catchAsyncError = require('../middlewares/catchAsyncError');
const OrderCounter = require('../models/OrderCounter');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const moment = require('moment');
const sendEmail = require('../utils/email');
const { loginUser } = require('./authController');
exports.createOrder = catchAsyncError(async (req, res, next) => {
    try {
        const {
            shippingInfo,
            items,
            amount,
            paymentMethod,
            deliveryCharge,
            token,
        } = req.body;
        const userId = req.user._id;
        const customerEmail = shippingInfo.email;
        const adminEmail = process.env.ADMIN_EMAIL;
        const today = moment().format('DDMMYYYY'); // for orderNumber
        const now = new Date(); // actual date field
        // Step 1: Get today's counter
        let counter = await OrderCounter.findOne({ date: today });

        if (!counter) {
            counter = await OrderCounter.create({ date: today, count: 1 });

        } else {
            counter.count += 1;
            await counter.save();
        }

        // Step 2: Generate order number
        const orderNumber = `#ORD${today}${counter.count.toString().padStart(2, '0')}`;

        let payment = {
            method: paymentMethod === 'card' ? 'Card' : 'Cash on Delivery',
            status: 'Pending',
            transactionId: ''
        };

        //Step 3: card payment
        // if (paymentMethod === 'card') {
        // if (!token || !token.id) {
        //   return res.status(400).json({ success: false, message: 'Stripe token missing' });
        // }

        //     const charge = await stripe.charges.create({
        //       amount: Math.round(amount * 100),
        //       currency: 'usd',
        //       description: 'Order Payment',
        //       source: token.id,
        //       receipt_email: token.email,
        //       metadata: { order_id: orderNumber }
        //     });

        //     if (charge.status !== 'succeeded') {
        //       return res.status(400).json({ success: false, message: 'Card payment failed' });
        //     }

        //     payment.status = 'Paid';
        //     payment.transactionId = charge.id;
        //   }
        const deliveryAmount = deliveryCharge ? deliveryCharge : 0;
        const order = await Order.create({
            user: userId,
            deliveryCharge: deliveryAmount,
            orderNumber,
            shippingInfo,
            items,
            amount,
            payment,
            orderStatus: 'Pending',
            createdAt: now
        });

        const orderedProductIds = items.map(item => item.productId.toString());

        const user = await User.findById(userId);

        await User.findByIdAndUpdate(user._id, {
            $pull: {
                cart: { _id: { $in: orderedProductIds } }
            }
        });
        try {
            await sendEmail(customerEmail, `Your Order ${orderNumber}`, 'customer', order, 'Ordered');
            await sendEmail(adminEmail, `New Order ${orderNumber}`, 'admin', order, 'Ordered');
            order.items.forEach(async orderItem => {
                await updateStock(orderItem.productId, orderItem.quantity)
            })
        } catch (emailErr) {
            console.error('Email send error:', emailErr.message);
        }
        const io = req.app.get('io');
        io.emit('newOrder', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            customer: order.shippingInfo?.name || "Unknown",
            createdAt: order.createdAt,
        });
        res.status(201).json({
            success: true,
            message: 'Order created successfully.',
            order: order
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

exports.getAllOrder = catchAsyncError(async (req, res, next) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.getMyOrders = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getOrderById = catchAsyncError(async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.productId', 'productName image price');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})
exports.updateOrder = catchAsyncError(async (req, res, next) => {
    const { status } = req.body;
    const invoiceFile = req.file;

    if (status === 'Delivered' && !invoiceFile) {
        return res.status(400).json({ error: 'Invoice file is required for Delivered status.' });
    }

    const order = await Order.findById(req.params.id).populate('user'); // Assuming you need order details
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const { shippingInfo, orderNumber } = order;
    const customerEmail = shippingInfo.email;
    const adminEmail = process.env.ADMIN_EMAIL;

    const updateData = { orderStatus: status };
    if (invoiceFile) {
        updateData.invoiceUrl = `/uploads/invoices/${invoiceFile.filename}`;
    }

    await Order.findByIdAndUpdate(req.params.id, updateData);

    // 📧 Compose different emails based on status
    let customerSubject = '';
    let customerMessage = '';
    let adminSubject = '';
    let adminMessage = '';

    switch (status) {
        case 'Shipped':
            customerSubject = `Your Order ${orderNumber} has been shipped`;
            customerMessage = `Good news! Your order ${orderNumber} has been shipped and is on the way.`;
            adminSubject = `Order ${orderNumber} marked as Shipped`;
            adminMessage = `Admin notification: Order ${orderNumber} status updated to Shipped.`;
            break;

        case 'Out for Delivery':
            customerSubject = `Your Order ${orderNumber} is out for delivery`;
            customerMessage = `Heads up! Your order ${orderNumber} is on its way and will be delivered soon.`;
            adminSubject = `Order ${orderNumber} is Out for Delivery`;
            adminMessage = `Admin alert: Order ${orderNumber} status updated to Out for Delivery.`;
            break;

        case 'Delivered':
            customerSubject = `Your Order ${orderNumber} has been delivered`;
            customerMessage = `Thanks for shopping with us! Order ${orderNumber} has been successfully delivered.`;
            adminSubject = `Order ${orderNumber} marked as Delivered`;
            adminMessage = `Admin notice: Order ${orderNumber} status updated to Delivered.`;
            break;

        default:
            // No email for other statuses
            return res.status(200).json({
                success: true,
                message: 'Order status updated without email notification',
            });
    }
    await sendEmail(customerEmail, customerSubject, 'customer', order, status);
    if (status === 'Delivered') {
        await sendEmail(adminEmail, adminSubject, 'admin', order, status);
    }

    res.status(200).json({
        success: true,
        message: 'Order status updated and emails sent',
    });
});


//Create New Order - api/v1/order/new
exports.newOrder = catchAsyncError(async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user.id
    })

    res.status(200).json({
        success: true,
        order
    })
})

//Get Single Order - api/v1/order/:id
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    res.status(200).json({
        success: true,
        order
    })
})

//Get Loggedin User Orders - /api/v1/myorders
exports.myOrders = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id });

    res.status(200).json({
        success: true,
        orders
    })
})

//Admin: Get All Orders - api/v1/orders
exports.orders = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach(order => {
        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
})

async function updateStock(productId, quantity) {
    const product = await Product.findById(productId);
    product.stock = product.stock - quantity;
    product.save({ validateBeforeSave: false })
}

//Admin: Delete Order - api/v1/order/:id
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    await order.remove();
    res.status(200).json({
        success: true
    })
})

