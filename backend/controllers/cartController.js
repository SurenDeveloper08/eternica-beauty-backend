const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const { convertCartItemPrices } = require('../utils/convertProductPrices');
const { convertPrice } = require('../utils/currency')


exports.addToCart = catchAsyncError(async (req, res, next) => {
    try {
        const { slug, variantId, sizeId, color, size } = req.body;
        const qty = parseInt(req.query?.qty ?? 1, 10);
        const token = req.user?._id;
        if (!token) {
            // Guest cart in localStorage handled on frontend
            return res.status(200).json({
                success: true,
                message: 'Guest cart updated locally.',
            });
        }

        const user = await User.findById(token);
        if (!user) return next(new ErrorHandler("User not found", 404));

        const product = await Product.findOne({ slug });
        if (!product) return next(new ErrorHandler("Product not found", 404));

        let availableStock = product.stock;
        let selectedVariant = null;
        let selectedSize = null;

        if (variantId) {
            selectedVariant = product.variants.id(variantId);
            if (!selectedVariant) return res.status(400).json({ success: false, message: "Variant not found" });

            if (sizeId) {
                selectedSize = selectedVariant.sizes?.id(sizeId);
                if (!selectedSize) return res.status(400).json({ success: false, message: "Size not found" });
                availableStock = selectedSize.stock ?? 0;
            } else {
                availableStock = selectedVariant.stock ?? 0;
            }
        }

        if (!availableStock || availableStock < qty) {
            return res.status(400).json({
                success: false,
                message: `Only ${availableStock} item(s) in stock.`,
            });
        }

        const existingItem = user.cart.find(item =>
            item.slug === slug &&
            (variantId ? item.variantId?.toString() === variantId : !item.variantId) &&
            (sizeId ? item.sizeId?.toString() === sizeId : !item.sizeId)
        );

        if (existingItem) {

            if (qty === 0) {
                // 🔹 Remove item completely if qty = 0
                user.cart = user.cart.filter(item =>
                    !(
                        item.slug === slug &&
                        (variantId ? item.variantId?.toString() === variantId : !item.variantId) &&
                        (sizeId ? item.sizeId?.toString() === sizeId : !item.sizeId)
                    )
                );
            } else {
                // Normal update
                const newQty = qty;
                if (newQty > 10) return res.status(400).json({ success: false, message: "Max 10 quantity per item." });
                if (newQty > availableStock) return res.status(400).json({
                    success: false,
                    message: `Only ${availableStock} item(s) available. You already added ${existingItem.quantity}.`,
                });
                existingItem.quantity = newQty;
            }
        } else {
            if (qty > 10) return res.status(400).json({ success: false, message: "Maximum quantity per item is 10." });
            user.cart.push({ slug, quantity: qty, ...(variantId && { variantId }), ...(sizeId && { sizeId }), ...(color && { color }), ...(size && { size }) });
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: existingItem ? "Cart quantity updated." : "Item added to cart.",
            cart: user.cart, // send updated cart for frontend convenience
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
        const currency = req.query.currency?.toUpperCase() || 'AED';
        let cartItemsData = [];
        let subtotalAED = 0;

        // Check if user is logged in
        const userId = req.user?._id;
        let cartItems = [];

        if (userId) {
            // Logged-in user
            const user = await User.findById(userId);
            if (user?.cart?.length) cartItems = user.cart;
        } else if (req.body?.items?.length) {
            // Guest cart sent from frontend
            cartItems = req.body.items;
        }

        if (!cartItems.length) {
            return res.status(200).json({
                success: true,
                count: 0,
                priceAED: 0,
                subtotalConverted: 0,
                deliveryFee: 0,
                totalPrice: 0,
                currency,
                data: [],
            });
        }

        // Process each cart item
        cartItemsData = await Promise.all(cartItems.map(async (item) => {
            const product = await Product.findOne({ slug: item.slug }).select(
                'productName image images price stock variants slug'
            );
            if (!product) return null;

            let variant = null;
            let sizeObj = null;
            let priceAED = product.price;
            let stock = product.stock;
            let image = product.image;

            if (item.color || item.size) {
                variant = product.variants.find(v => {
                    const colorMatch = item.color ? v.color === item.color : true;
                    const sizeMatch = item.size ? v.sizes?.some(s => s.name === item.size) : true;
                    return colorMatch && sizeMatch;
                });

                if (!variant) return null;

                sizeObj = variant.sizes?.find(s => s.name === item.size);
                priceAED = sizeObj?.price ?? variant.price ?? product.price;
                stock = sizeObj?.stock ?? variant.stock ?? product.stock;
                image = sizeObj?.images?.[0] || variant.images?.[0] || product.image;
            }

            const inStock = typeof stock === 'number' ? stock > 0 : true;
            const adjustedQty = inStock ? Math.min(item.quantity, stock) : 0;

            const itemSubtotalAED = priceAED * adjustedQty;
            if (inStock) subtotalAED += itemSubtotalAED;

            const priceConverted = await convertPrice(priceAED, currency);
            const subtotalConverted = priceConverted * adjustedQty;

            return {
                slug: item.slug,
                quantity: adjustedQty,
                overStock: item.quantity > stock,
                color: item.color || null,
                size: item.size || null,
                variantId: variant?._id || null,
                sizeId: sizeObj?._id || null,
                priceAED,
                priceConverted,
                subtotalConverted,
                inStock,
                product: {
                    productName: product.productName,
                    slug: product.slug,
                    image,
                    price: priceAED,
                    sizes: variant?.sizes || [],
                    colors: product.variants.map(v => v.color),
                },
                stock,
            };
        }));

        const filteredCart = cartItemsData.filter(Boolean);

        const subtotalConverted = filteredCart
            .filter(item => item.inStock)
            .reduce((sum, item) => sum + item.subtotalConverted, 0);

        const deliveryFeeAED = subtotalConverted < 300 ? 25 : 0;
        const deliveryFee = await convertPrice(deliveryFeeAED, currency);

        const totalPrice = subtotalConverted + deliveryFee;

        return res.status(200).json({
            success: true,
            count: filteredCart.length,
            priceAED: subtotalAED,
            subtotalConverted: +subtotalConverted.toFixed(2),
            deliveryFee: +deliveryFee.toFixed(2),
            totalPrice: +totalPrice.toFixed(2),
            currency,
            data: filteredCart,
        });

    } catch (err) {
        next(err);
    }
};

exports.mergeGuestCart = catchAsyncError(async (req, res, next) => {

    const guestCart = req.body.cart; // Array of guest cart items
    const userId = req.user?._id;

    if (!userId) return next(new ErrorHandler("User not authenticated", 401));
    if (!Array.isArray(guestCart) || guestCart.length === 0) {
        return res.status(200).json({ success: true, message: "No guest cart to merge." });
    }

    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User not found", 404));

    for (const item of guestCart) {
        const { slug, variantId = "", sizeId = "", color = "", size = "", quantity = 0 } = item;

        if (!slug || quantity <= 0) continue;

        const product = await Product.findOne({ slug });
        if (!product) continue;

        // Determine available stock
        let availableStock = product.stock;
        let selectedVariant = null;
        let selectedSize = null;

        if (variantId) {
            selectedVariant = product.variants.id(variantId);
            if (!selectedVariant) continue;
            availableStock = selectedVariant.stock ?? 0;

            if (sizeId) {
                selectedSize = selectedVariant.sizes?.id(sizeId);
                if (!selectedSize) continue;
                availableStock = selectedSize.stock ?? 0;
            }
        }

        if (availableStock <= 0) continue;

        // Find existing item in user cart
        const existingItem = user.cart.find(cartItem =>
            cartItem.slug === slug &&
            (variantId ? cartItem.variantId === variantId : !cartItem.variantId) &&
            (sizeId ? cartItem.sizeId === sizeId : !cartItem.sizeId)
        );

        if (existingItem) {
            const newQty = Math.min(existingItem.quantity + quantity, availableStock, 10); // max 10 per item
            existingItem.quantity = newQty;
        } else {
            const newQty = Math.min(quantity, availableStock, 10);
            user.cart.push({ slug, variantId, sizeId, color, size, quantity: newQty });
        }
    }

    await user.save();

    return res.status(200).json({ success: true, message: "Guest cart merged.", cart: user.cart });
});

exports.validateCart = async (req, res, next) => {
    try {

        console.log('entered');

        let cart = [];

        const currency = req.query.currency?.toUpperCase() || 'AED';
        const country = req.query.country?.toUpperCase(); // may be empty

        if (req.user) {
            // Logged-in user
            const user = await User.findById(req.user._id);
            cart = user?.cart || [];
        } else {
            console.log('entered guest');
            // Guest user
            try {
               cart = req.body?.cart || [];

            } catch {
                cart = [];
            }
        }
        console.log(cart);
        if (!cart.length) {
            return res.status(200).json({
                success: true,
                count: 0,
                totalPrice: 0,
                deliveryFee: 0,
                currency,
                eligible: [],
                nonEligible: []
            });
        }

        let rawTotalPrice = 0;
        let eligibleSubtotalConverted = 0;

        const cartItems = await Promise.all(cart.map(async (item) => {
            const product = await Product.findOne({ slug: item.slug }).select(
                'productName image images price stock variants slug sellGlobally restrictedCountries allowedCountries'
            );
            if (!product) return null;

            let variant = null;
            let sizeObj = null;
            let price = product.price;
            let stock = product.stock;
            let image = product.image;

            // Match variant and size
            if (item.color || item.size) {
                variant = product.variants.find(v => {
                    const colorMatch = item.color ? v.color === item.color : true;
                    const sizeMatch = item.size ? v.sizes?.some(s => s.name === item.size) : true;
                    return colorMatch && sizeMatch;
                });

                if (!variant) return null;

                sizeObj = variant.sizes?.find(s => s.name === item.size);
                price = sizeObj?.price ?? variant.price ?? product.price;
                stock = sizeObj?.stock ?? variant.stock ?? product.stock;
                image = sizeObj?.images?.[0] || variant.images?.[0] || product.image;
            }

            const inStock = typeof stock === 'number' ? stock > 0 : true;
            if (!inStock) return null;

            // Clamp quantity to stock
            const adjustedQty = Math.min(item.quantity, stock);

            // Determine eligibility
            let eligible = false;
            if (!country) {
                // If country is empty, all products eligible
                eligible = true;
            } else {
                // Normal eligibility check
                eligible = isProductEligible(product, country);
            }

            const subtotal = price * adjustedQty;
            if (eligible) rawTotalPrice += subtotal;

            // Convert price and subtotal
            const priceConverted = await convertPrice(price, currency);
            const subtotalConverted = priceConverted * adjustedQty;
            if (eligible) eligibleSubtotalConverted += subtotalConverted;

            return {
                slug: item.slug,
                quantity: adjustedQty,
                overStock: item.quantity > stock,
                color: item.color || null,
                size: item.size || null,
                variantId: variant?._id || null,
                sizeId: sizeObj?._id || null,
                product: {
                    productName: product.productName,
                    slug: product.slug,
                    image,
                    sizes: variant?.sizes || [],
                    colors: product.variants.map(v => v.color),
                },
                stock,
                priceAED: price,
                price: priceConverted,
                subtotal: subtotalConverted,
                inStock: true,
                eligible
            };
        }));

        const filtered = cartItems.filter(Boolean);
        const eligibleItems = filtered.filter(i => i.eligible);
        const nonEligibleItems = filtered.filter(i => !i.eligible);

        // Delivery Fee based on AED subtotal
        const deliveryFeeAED = eligibleSubtotalConverted < 300 ? 25 : 0;
        const deliveryFee = await convertPrice(deliveryFeeAED, currency);
        const totalPrice = eligibleSubtotalConverted + deliveryFee;

        return res.status(200).json({
            success: true,
            count: eligibleItems.length,
            deliveryFee,
            totalPrice,
            currency,
            eligible: eligibleItems,
            nonEligible: nonEligibleItems,
            products: filtered
        });

    } catch (err) {
        next(err);
    }
};

function isProductEligible(product, countryCode) {
    if (product.sellGlobally) {
        return !(product.restrictedCountries || []).includes(countryCode);
    } else {
        return (product.allowedCountries || []).includes(countryCode);
    }
}

exports.updateCartQuantity = async (req, res, next) => {
    try {
        const { slug, variantId, sizeId, quantity } = req.body;

        if (!slug || quantity == null) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return next(new ErrorHandler("User not found", 404));

        // Find cart item by slug + variantId + sizeId
        const cartIndex = user.cart.findIndex(item =>
            item.slug === slug &&
            (variantId ? item.variantId?.toString() === variantId : !item.variantId) &&
            (sizeId ? item.sizeId?.toString() === sizeId : !item.sizeId)
        );

        if (cartIndex === -1) return next(new ErrorHandler("Item not found in cart", 404));

        // Remove if quantity is 0 or less
        if (quantity <= 0) {
            user.cart.splice(cartIndex, 1);
        } else {
            if (quantity > 10) {
                return res.status(400).json({ success: false, message: "Maximum quantity is 10." });
            }

            // Check stock before updating
            const product = await Product.findOne({ slug });
            if (!product) return next(new ErrorHandler("Product not found", 404));

            let availableStock = product.stock;

            if (variantId) {
                const variant = product.variants.id(variantId);
                if (!variant) return next(new ErrorHandler("Variant not found", 404));

                if (sizeId) {
                    const size = variant.sizes?.id(sizeId);
                    if (!size) return next(new ErrorHandler("Size not found", 404));
                    availableStock = size.stock ?? 0;
                } else {
                    availableStock = variant.stock ?? 0;
                }
            }

            if (quantity > availableStock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${availableStock} item(s) in stock.`,
                });
            }

            // All checks passed, update quantity
            user.cart[cartIndex].quantity = quantity;
        }

        await user.save();

        // Build full updated cart response
        const updatedCart = await Promise.all(user.cart.map(async item => {
            const product = await Product.findOne({ slug: item.slug }).select('productName price image stock variants');

            if (!product) return null;

            // Get final price and stock
            let availableStock = product.stock;
            let variant = null;
            let size = null;

            if (item.variantId) {
                variant = product.variants.id(item.variantId);
                if (!variant) return null;
                if (item.sizeId) {
                    size = variant.sizes?.id(item.sizeId);
                    if (!size) return null;
                    availableStock = size.stock ?? 0;
                } else {
                    availableStock = variant.stock ?? 0;
                }
            }

            const inStock = availableStock > 0;
            const subtotal = product.price * item.quantity;

            return {
                slug: item.slug,
                variantId: item.variantId,
                sizeId: item.sizeId,
                quantity: item.quantity,
                product: {
                    name: product.productName,
                    image: product.image,
                    price: product.price
                },
                subtotal,
                inStock
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
            message: quantity <= 0 ? "Item removed from cart" : "Cart quantity updated",
            count: filteredCart.length,
            price: totalPrice,
            vat,
            totalPrice: total,
            data: filteredCart
        });
    } catch (err) {
        next(err);
    }
};

exports.removeFromCart = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    const { variantId, sizeId } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const initialLength = user.cart.length;

    user.cart = user.cart.filter(item => {
        const slugMatch = item.slug === slug;

        const variantMatch = variantId ? item.variantId === variantId : !item.variantId;
        const sizeMatch = sizeId ? item.sizeId === sizeId : !item.sizeId;

        // Remove only if all match
        return !(slugMatch && variantMatch && sizeMatch);
    });

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

