const catchAsyncError = require('../middlewares/catchAsyncError');
const OrderCounter = require('../models/OrderCounter');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const moment = require('moment');
const { sendEmail } = require('../utils/email');
const { loginUser } = require('./authController');

async function updateStock(slug, quantity, color = null, size = null) {
    const product = await Product.findOne({ slug });
    if (!product) throw new Error("Product not found");

    // 1️⃣ No Variants
    if (!product.variants || product.variants.length === 0) {
        product.stock = Math.max((product.stock || 0) - quantity, 0);
        return await product.save({ validateBeforeSave: false });
    }

    // 2️⃣ Color + Size
    if (color && size) {
        const variant = product.variants.find(v => v.color === color);
        if (!variant) throw new Error("Color variant not found");

        const sizeObj = variant.sizes?.find(s => s.name === size);
        if (!sizeObj) throw new Error("Size not found in selected color");

        // Deduct stock from both size-level and color-level
        sizeObj.stock = Math.max((sizeObj.stock || 0) - quantity, 0);
        variant.stock = Math.max((variant.stock || 0) - quantity, 0);

        return await product.save({ validateBeforeSave: false });
    }

    // 3️⃣ Color-only
    if (color && !size) {
        const variant = product.variants.find(v => v.color === color);
        if (!variant) throw new Error("Color variant not found");

        variant.stock = Math.max((variant.stock || 0) - quantity, 0);
        return await product.save({ validateBeforeSave: false });
    }

    // 4️⃣ Size-only (no color)
    if (!color && size) {
        const variant = product.variants.find(v =>
            (v.sizes || []).some(s => s.name === size)
        );
        if (!variant) throw new Error("Size-only variant not found");

        const sizeObj = variant.sizes.find(s => s.name === size);
        sizeObj.stock = Math.max((sizeObj.stock || 0) - quantity, 0);
        return await product.save({ validateBeforeSave: false });
    }

    throw new Error("Invalid variant combination for stock update");
}

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
        const currency = req.query.currency?.toUpperCase() || 'AED';
        const { eligible } = req.body;
        const userId = req.user._id;
        const customerEmail = shippingInfo.email;
        const adminEmail1 = process.env.ADMIN_EMAIL1;
        const adminEmail2 = process.env.ADMIN_EMAIL2;
        const adminEmail3 = process.env.ADMIN_EMAIL3;
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
            eligible,
            deliveryCharge: deliveryAmount,
            orderNumber,
            shippingInfo,
            items,
            amount,
            payment,
            currency,
            orderStatus: 'Pending',
            createdAt: now
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully.',
            order: order
        });
        (async () => {
            try {
                await sendEmail(customerEmail, 'customer', order, 'Ordered', currency, eligible);
                await sendEmail(adminEmail1, 'admin', order, 'Ordered', currency, eligible);
                await sendEmail(adminEmail2, 'admin', order, 'Ordered', currency, eligible);
                await sendEmail(adminEmail3, 'admin', order, 'Ordered', currency, eligible);
                const orderedProductIds = items.map(item => item.slug);

                const user = await User.findById(userId);

                await User.findByIdAndUpdate(user._id, {
                    $pull: {
                        cart: { slug: { $in: orderedProductIds } }
                    }
                });
                await Promise.all(
                    order.items.map(item =>
                        updateStock(item.slug, item.quantity, item.color || null, item.size || null)
                    )
                );

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
        })();

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
            .populate('items.slug', 'productName image price');

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
    const adminEmail1 = process.env.ADMIN_EMAIL1;
    const adminEmail2 = process.env.ADMIN_EMAIL2;
    const adminEmail3 = process.env.ADMIN_EMAIL3;
    const updateData = { orderStatus: status };
    if (invoiceFile) {
        const baseUrl =
            process.env.NODE_ENV === 'production'
                ? `${req.protocol}://${req.get('host')}`
                : process.env.BACKEND_URL;

        updateData.invoice = `${baseUrl}/uploads/invoices/${invoiceFile.filename}`;

    }

    await Order.findByIdAndUpdate(req.params.id, updateData);

    if (status === 'Ordered') {
        await sendEmail(customerEmail, 'customer', order, status, order.currency, order.eligible);
        await sendEmail(adminEmail1, 'admin', order, status, order.currency, order.eligible);
        await sendEmail(adminEmail2, 'admin', order, status, order.currency, order.eligible);
        await sendEmail(adminEmail3, 'admin', order, status, order.currency, order.eligible);
    }
    else if (status === 'Out for Delivery') {
        await sendEmail(customerEmail, 'customer', order, status, order.currency, order.eligible);
    }
    else if (status === 'Delivered') {
        await sendEmail(customerEmail, 'customer', order, status, order.currency, order.eligible, updateData?.invoice);
        await sendEmail(adminEmail1, 'admin', order, status, order.currency, order.eligible, updateData?.invoice);
        await sendEmail(adminEmail2, 'admin', order, status, order.currency, order.eligible, updateData?.invoice);
        await sendEmail(adminEmail3, 'admin', order, status, order.currency, order.eligible, updateData?.invoice);
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

