const catchAsyncError = require('../middlewares/catchAsyncError');
const ProductHighlight = require('../models/highlightModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const { convertProductPrices } = require('../utils/convertProductPrices');
const mongoose = require("mongoose");

//admin
exports.createProductHighlight = catchAsyncError(async (req, res) => {
    try {

        const { productId, category, sortOrder, isActive } = req.body;
        
        if (!productId || !category) {
            return res.status(400).json({ success: false, message: "productId and category are required." });
        }

        const product = await Product.findById(productId );
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const highlight = await ProductHighlight.create({
            productId:product._id,
            category,
            sortOrder: sortOrder || 0,
            isActive: (typeof isActive === 'boolean' ? isActive : true),
        });

        return res.status(201).json({ success: true, data: highlight });
    } catch (error) {
        console.error("Create Highlight Error:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//admin
exports.getProductHighlightById = catchAsyncError(async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID." });
        }

        const highlight = await ProductHighlight.findById(id).populate('productId');

        if (!highlight) {
            return res.status(404).json({ success: false, message: "Highlight not found." });
        }

        return res.json({ success: true, data: highlight });
    } catch (error) {
        console.error("Get Highlight by ID Error:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//admin
exports.updateProductHighlight = catchAsyncError(async (req, res) => {
    try {
        const { id } = req.params;
       if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID." });
        }

        const updateData = { ...req.body };

         const updated = await ProductHighlight.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Highlight not found." });
        }

        return res.json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Highlight Error:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//admin
exports.toggleProductHighlightStatus = catchAsyncError(async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID." });
        }

        const highlight = await ProductHighlight.findById(id);
        if (!highlight) {
            return res.status(404).json({ success: false, message: "Highlight not found." });
        }

        highlight.isActive = !highlight.isActive;
        await highlight.save();

        return res.json({ success: true, message: `Highlight ${highlight.isActive ? 'activated' : 'deactivated'}`, data: highlight });
    } catch (error) {
        console.error("Toggle Highlight Status Error:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//admin
exports.getAllProductHighlights = catchAsyncError(async (req, res) => {
    try {
        const highlights = await ProductHighlight
            .find()
            .sort({ sortOrder: 1 })
            .populate('productId');
        if (!highlights || highlights.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No highlights found",
            });
        }

        return res.json({
            success: true,
            count: highlights.length,
            data: highlights
        });
    } catch (error) {
        console.error("Get Highlighted Products Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

//admin
exports.getActiveProductHighlights = catchAsyncError(async (req, res) => {
    try {
        const highlights = await ProductHighlight.find({ isActive: true })
            .populate('productId', 'productName image')
            .sort({ sortOrder: 1 });

        return res.json({ success: true, count: highlights.length, data: highlights });
    } catch (error) {
        console.error("Get Active Highlights Error:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//user
exports.getActiveHighlightedProducts = catchAsyncError(async (req, res) => {
  const { category } = req.query;

  const allowedCategories = ['trending', 'favourite'];
  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid highlight category. Allowed: trending, favourite',
    });
  }

  const highlights = await ProductHighlight.find({
    category,
    isActive: true,
  })
    .sort({ sortOrder: 1 }) // sort by custom sortOrder if needed
    .populate({
      path: 'productId',
      match: { isActive: true }, // ensure only active products are included
      select: '-__v', // optional: exclude __v or choose fields
    });

  // Filter out any highlight entry with no populated product (i.e., product was inactive or deleted)
  const activeProducts = highlights
    .filter((h) => h.productId) // product was populated and active
    .map((h) => h.productId);

  return res.status(200).json({
    success: true,
    count: activeProducts.length,
    data: activeProducts,
  });
});

exports.highlightUpload = catchAsyncError(async (req, res, next) => {
    try {
        const { productId, category, sortOrder, isActive } = req.body;

        const highlight = new ProductHighlight({ productId, category, sortOrder, isActive });
        await highlight.save();
        res.status(200).send({
            success: true,
            data: highlight
        })
    } catch (err) {
        res.status(400).json({ error: 'Invalid input' });
    }
});
exports.gethighlights = catchAsyncError(async (req, res, next) => {
    try {
        const currency = req.query.currency || 'AED';
        const filter = {};

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }

        const highlights = await ProductHighlight
            .find(filter)
            .sort({ sortOrder: 1 })
            .populate('productId');

        const productsOnly = highlights
            .filter(h => h.productId) // ensure populated
            .map(h => h.productId);

        if (!productsOnly || productsOnly.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No highlights found matching the criteria",
                data: [],
            });
        }
        const converted = await Promise.all(
            productsOnly.map(p => convertProductPrices(p, currency))
        );
        res.status(200).json({
            success: true,
            count: highlights.length,
            message: "Highlights fetched successfully",
            currency,
            data: converted,
        });

    } catch (err) {
        console.error("Highlight fetch error:", err);
        res.status(500).json({
            success: false,
            message: "Server error while fetching highlights",
            error: err.message,
        });
    }
});

exports.gethighlightsAdmin = catchAsyncError(async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        // Optional: isActive filter
        // if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

        const highlights = await ProductHighlight
            .find(filter)
            .sort({ sortOrder: 1 })
            .populate('productId');

        if (!highlights || highlights.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No highlights found for the given criteria",
            });
        }

        res.status(200).json({
            success: true,
            count: highlights.length,
            message: "Highlights fetched successfully",
            data: highlights,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
});

exports.getHighlightById = catchAsyncError(async (req, res, next) => {
    try {
        const highlight = await ProductHighlight.findById(req.params.id).populate('productId');

        if (!highlight) {
            return res.status(404).json({
                success: false,
                message: 'Highlight not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Highlight fetched successfully',
            data: highlight
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});
exports.highlightUpdate = catchAsyncError(async (req, res, next) => {
    try {
        const { productId, category, sortOrder, isActive } = req.body;

        const highlight = await ProductHighlight.findById(req.params.id);
        if (!highlight) {
            return res.status(404).json({
                success: false,
                message: 'Highlight not found',
            });
        }

        // Update fields
        highlight.productId = productId ?? highlight.productId;
        highlight.category = category ?? highlight.category;
        highlight.sortOrder = sortOrder ?? highlight.sortOrder;
        highlight.isActive = isActive ?? highlight.isActive;

        await highlight.save();

        res.status(200).json({
            success: true,
            message: 'Highlight updated successfully',
            data: highlight,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Invalid input',
            error: err.message,
        });
    }
});
exports.deleteHighlight = catchAsyncError(async (req, res, next) => {
    const highlight = await ProductHighlight.findById(req.params.id);

    if (!highlight) {
        return res.status(404).json({
            success: false,
            message: 'Highlight not found',
        });
    }

    await highlight.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Highlight deleted successfully',
    });
});
exports.updateHighlightStatus = catchAsyncError(async (req, res, next) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: '`isActive` must be a boolean value.',
        });
    }

    const highlight = await ProductHighlight.findById(req.params.id);

    if (!highlight) {
        return res.status(404).json({
            success: false,
            message: 'Highlight not found',
        });
    }

    highlight.isActive = isActive;
    await highlight.save();

    res.status(200).json({
        success: true,
        message: 'Highlight status updated successfully',
        data: highlight,
    });
});