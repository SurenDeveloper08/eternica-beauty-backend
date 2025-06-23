const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');

exports.addToCart = catchAsyncError(async (req, res, next) => {

    try {
        const { id } = req.body;
        const qty = req.query?.qty;
        const user = await User.findById(req.user._id);


        if (!user) return next(new ErrorHandler("User not found", 404));

        const exists = user.cart.find(item => item._id.toString() === id);

        if (exists) {
            const total = Number(exists?.quantity) + Number(qty);
            if (exists.quantity > 10 || total > 10) {

                return res.status(201).json({
                    success: false,
                    message: "Maximum quantity 10."
                });
            }
            else {
                exists.quantity = total
            }

        } else {
            user.cart.push({ _id: id, quantity: qty });
        }



        await user.save();

        res.status(200).json({
            success: true,
            message: "Cart Added",
        });

    } catch (err) {
        next(err);
    }
});


exports.getCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.cart.length) {
            return res.status(200).json({
                success: true,
                count: 0,
                totalPrice: 0,
                data: [],
            });
        }

        let totalPrice = 0;
        let deliveryFee = 0;
        const cartItems = await Promise.all(
            user.cart.map(async (item) => {
                const product = await Product.findById(item._id)
                    .select('productName price image colors sizes stock');

                if (!product) return null;

                // Determine stock availability
                let inStock = true;
                if (typeof product.stock === 'boolean') {
                    inStock = product.stock;
                } else if (typeof product.stock === 'number') {
                    inStock = product.stock > 0;
                }

                const subtotal = product.price * item.quantity;

                // Only add to totalPrice if product is in stock
                if (inStock) {
                    totalPrice += subtotal;
                }

                return {
                    productId: item._id,
                    quantity: item.quantity,
                    product,
                    subtotal,
                    inStock,
                };
            })
        );

        const filteredCart = cartItems.filter(Boolean);
        const vat = parseFloat((totalPrice * 0.05).toFixed(2));
        const total = parseFloat((totalPrice + vat).toFixed(2));
        deliveryFee = Number(totalPrice) < 300 ? 30 : 0;
        totalPrice = totalPrice + deliveryFee;

        res.status(200).json({
            success: true,
            count: filteredCart.length,
            totalPrice,
            price: totalPrice,
            deliveryFee,
            vat,
            data: filteredCart,
        });

    } catch (err) {
        next(err);
    }
};


exports.updateCartQuantity = async (req, res, next) => {
    const { productId, quantity } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    const cartIndex = user.cart.findIndex(item => item._id.toString() === productId);
    if (cartIndex === -1) return next(new ErrorHandler("Product not in cart", 404));

    if (quantity <= 0) {
        // Remove item from cart
        user.cart.splice(cartIndex, 1);
    } else {
        if (quantity > 10) {
            return res.status(201).json({
                success: false,
                message: "Maximum quantity 10."
            });
        }

        // Update quantity
        user.cart[cartIndex].quantity = quantity;
    }

    await user.save();

    // Prepare updated cart response
    const updatedCart = await Promise.all(user.cart.map(async item => {
        const product = await Product.findById(item._id).select('productName price image colors sizes stock');
        if (!product) return null;

        const inStock = typeof product.stock === 'boolean' ? product.stock : product.stock > 0;
        const subtotal = product.price * item.quantity;

        return {
            productId: item._id,
            quantity: item.quantity,
            product,
            subtotal,
            inStock,
        };
    }));

    const filteredCart = updatedCart.filter(Boolean);
    const totalPrice = filteredCart
        .filter(item => item.inStock)
        .reduce((sum, item) => sum + item.subtotal, 0);

    const vat = parseFloat((totalPrice * 0.05).toFixed(2));
    const total = parseFloat((totalPrice + vat).toFixed(2));

    res.status(200).json({
        success: true,
        message: quantity <= 0 ? "Item removed from cart" : "Cart quantity updated successfully",
        count: filteredCart.length,
        price: totalPrice,
        vat,
        totalPrice: total,
        data: filteredCart,
    });
};


exports.removeFromCart = catchAsyncError(async (req, res, next) => {
    const productId = req.params.productId;

    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const initialLength = user.cart.length;
    user.cart = user.cart.filter(item => item._id.toString() !== productId);

    if (user.cart.length === initialLength) {
        return res.status(404).json({
            success: false,
            message: 'Product not found in cart',
        });
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Product removed from cart',
        cart: user.cart,
    });
});

exports.getSingleCartItem = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) return next(new ErrorHandler("User not found", 404));

    const cartItem = user.cart.find(item => item._id.toString() === productId);

    if (!cartItem) {
        return res.status(404).json({
            success: false,
            message: "Product not found in cart",
        });
    }

    const product = await Product.findById(cartItem._id)
        .select('productName price image colors sizes stock');

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product data not found",
        });
    }

    let inStock = typeof product.stock === 'boolean' ? product.stock : product.stock > 0;

    const subtotal = product.price * cartItem.quantity;

    res.status(200).json({
        success: true,
        data: {
            productId: cartItem._id,
            quantity: cartItem.quantity,
            product,
            subtotal,
            inStock,
        },
    });
});
