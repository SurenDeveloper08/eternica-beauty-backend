const catchAsyncError = require('../middlewares/catchAsyncError');
const ProductHighlight = require('../models/highlightModel');
const ErrorHandler = require('../utils/errorHandler');
const {convertProductPrices} = require('../utils/convertProductPrices');

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