const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');

exports.addToCart = catchAsyncError(async (req, res, next) => {
    try {
        const { slug } = req.body;
        const qty = parseInt(req.query?.qty) || 1;

        const user = await User.findById(req.user._id);
        if (!user) return next(new ErrorHandler("User not found", 404));

        const product = await Product.findOne({ slug });

        if (!product) return next(new ErrorHandler("Product not found", 404));

        if (!product.stock || product.stock < qty) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} item(s) in stock.`,
            });
        }

        const exists = user.cart.find(item => item?.slug === slug);

        if (exists) {
            const totalQty = exists.quantity + qty;
            if (totalQty > 10) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum quantity per item is 10.",
                });
            }
            if (totalQty > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} item(s) available. You already added ${exists.quantity}.`,
                });
            }
            exists.quantity = totalQty;
        } else {
            if (qty > 10) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum quantity per item is 10.",
                });
            }
            user.cart.push({ slug: slug, quantity: qty });
        }

        await user.save();
        return res.status(200).json({
            success: true,
            message: "Cart added successfully.",
        });
    } catch (err) {
        next(err);
    }
});
// GET /api/v1/cart/qty/:productId
exports.getCartQty = catchAsyncError(async (req, res, next) => {
    const slug = req.params.slug;

    const user = await User.findById(req.user._id);

    if (!user) return next(new ErrorHandler("User not found", 404));

    const item = user.cart.find((item) => item.slug === slug);
    res.status(200).json({
        success: true,
        qty: item ? item.quantity : 0,
    });
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
                const product = await Product.findOne({ slug: item.slug })
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
                    slug: item.slug,
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
    const { slug, quantity } = req.body;
     const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    const cartIndex = user.cart.findIndex(item => item.slug === slug);
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
        const product = await Product.findOne({ slug: item.slug }).select('productName price image colors sizes stock');
        if (!product) return null;

        const inStock = typeof product.stock === 'boolean' ? product.stock : product.stock > 0;
        const subtotal = product.price * item.quantity;

        return {
            slug: item.slug,
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
    const slug = req.params.slug;
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const initialLength = user.cart.length;
    user.cart = user.cart.filter(item => item.slug !== slug);

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
    const { slug } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) return next(new ErrorHandler("User not found", 404));

    const cartItem = user.cart.find(item => item.slug === slug);

    if (!cartItem) {
        return res.status(404).json({
            success: false,
            message: "Product not found in cart",
        });
    }

    const product = await Product.findOne({ slug }).select('productName price image colors sizes stock');

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product data not found",
        });
    }

    const inStock = typeof product.stock === 'boolean' ? product.stock : product.stock > 0;

    const subtotal = product.price * cartItem.quantity;

    res.status(200).json({
        success: true,
        data: {
            slug: cartItem.slug,
            quantity: cartItem.quantity,
            product,
            subtotal,
            inStock,
        },
    });
});

