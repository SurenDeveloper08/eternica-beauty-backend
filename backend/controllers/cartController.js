const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');

exports.addToCart = catchAsyncError(async (req, res, next) => {
    try {
        const { slug, color, size } = req.body;
       
        const qty = parseInt(req.query?.qty) || 1;  

        const user = await User.findById(req.user._id);
        if (!user) return next(new ErrorHandler("User not found", 404));

        const product = await Product.findOne({ slug });
        if (!product) return next(new ErrorHandler("Product not found", 404));

        let availableStock = product.stock;

        // Try to locate variant stock if color/size provided
        if (color || size) {
            const matchedVariant = product.variants.find(variant => {
                const colorMatch = color ? variant.color === color : true;
                const sizeMatch = size ? variant.sizes?.some(s => s.name === size) : true;
                return colorMatch && sizeMatch;
            });

            if (!matchedVariant) {
                return res.status(400).json({ success: false, message: "Variant not found" });
            }

            if (size) {
                const matchedSize = matchedVariant.sizes?.find(s => s.name === size);
                availableStock = matchedSize?.stock ?? 0;
            } else {
                availableStock = matchedVariant.stock ?? 0;
            }
        }

        if (!availableStock || availableStock < qty) {
            return res.status(400).json({
                success: false,
                message: `Only ${availableStock} item(s) in stock.`,
            });
        }

        // Match cart item by slug + color + size
        const existingCartItem = user.cart.find(item =>
            item.slug === slug &&
            (color ? item.color === color : !item.color) &&
            (size ? item.size === size : !item.size)
        );

        if (existingCartItem) {
            const totalQty = existingCartItem.quantity + qty;

            if (totalQty > 10) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum quantity per item is 10.",
                });
            }

            if (totalQty > availableStock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${availableStock} item(s) available. You already added ${existingCartItem.quantity}.`,
                });
            }

            existingCartItem.quantity = totalQty;
        } else {
            if (qty > 10) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum quantity per item is 10.",
                });
            }

            user.cart.push({
                slug,
                quantity: qty,
                ...(color && { color }),
                ...(size && { size })
            });
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

exports.getCartQty = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    const { color, size } = req.query;

    const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    const item = user.cart.find((item) => {
        if (item.slug !== slug) return false;

        const colorMatch = color ? item.color === color : !item.color;
        const sizeMatch = size ? item.size === size : !item.size;

        return colorMatch && sizeMatch;
    });

    return res.status(200).json({
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
                const product = await Product.findOne({ slug: item.slug }).select(
                    'productName image images price stock variants slug'
                );
                if (!product) return null;

                let variant = null;
                let variantStock = product.stock;
                let variantPrice = product.price;
                let variantImage = product.image;
                let inStock = true;

                // Variant detection (color/size)
                if (item.color || item.size) {
                    variant = product.variants.find((v) => {
                        const colorMatch = item.color ? v.color === item.color : true;
                        const sizeMatch = item.size
                            ? (v.sizes || []).some((s) => s.name === item.size)
                            : true;
                        return colorMatch && sizeMatch;
                    });

                    if (variant) {
                        const sizeObj = (variant.sizes || []).find((s) => s.name === item.size);
                        variantPrice = sizeObj?.price ?? variant.price ?? product.price;
                        variantStock = sizeObj?.stock ?? variant.stock ?? product.stock;
                        variantImage = (sizeObj?.images?.[0] || variant.images?.[0]) || product.image;
                    } else {
                        return null; // Variant not found — skip item
                    }
                }

                // Determine stock availability
                inStock = typeof variantStock === 'number' ? variantStock > 0 : Boolean(variantStock);

                const subtotal = variantPrice * item.quantity;
                if (inStock) {
                    totalPrice += subtotal;
                }

                return {
                    slug: item.slug,
                    quantity: item.quantity,
                    color: item.color || null,
                    size: item.size || null,
                    product: {
                        productName: product.productName,
                        price: variantPrice,
                        image: variantImage,
                        slug: product.slug,
                        sizes: variant?.sizes || [],
                        colors: product.variants.map(v => v.color),
                    },
                    stock: variantStock,
                    subtotal,
                    inStock,
                };
            })
        );

        const filteredCart = cartItems.filter(Boolean);
        // const vat = parseFloat((totalPrice * 0.05).toFixed(2));
        // const total = parseFloat((totalPrice + vat).toFixed(2));
        deliveryFee = Number(totalPrice) < 300 ? 30 : 0;
        totalPrice = totalPrice + deliveryFee;

        res.status(200).json({
            success: true,
            count: filteredCart.length,
            price: totalPrice,
            deliveryFee,
            totalPrice,
            // totalPrice: parseFloat((totalPrice + vat + deliveryFee).toFixed(2)),
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

