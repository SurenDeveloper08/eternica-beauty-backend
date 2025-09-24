const catchAsyncError = require('../middlewares/catchAsyncError');
const Banner = require('../models/bannerModel');
const ErrorHandler = require('../utils/errorHandler');

exports.bannerUpload = catchAsyncError(async (req, res, next) => {
    const files = req.files;
    const { names, links, category, subCategory, sortOrders } = req.body;

    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const safeNames = Array.isArray(names) ? names : [names];
    const safeCategory = Array.isArray(category) ? category : [category];
    const safeSubCategory = Array.isArray(subCategory) ? subCategory : [subCategory];
    const safeLinks = Array.isArray(links) ? links : [links];
    const safeSortOrders = Array.isArray(sortOrders) ? sortOrders : [sortOrders];

    let banners = [];

    for (let i = 0; i < files.length; i++) {
        if (safeNames[i] && safeLinks[i]) {
            banners.push({
                name: safeNames[i],
                category: safeCategory[i],
                subCategory: safeSubCategory[i],
                imageUrl: `${BASE_URL}/uploads/banner/${files[i].filename}`,
                sortOrder: parseInt(safeSortOrders[i]) || 0,
            });
        }
    }

    const data = await Banner.insertMany(banners);
    res.status(201).json({
        success: true,
        data,
    });
});
exports.getBanners = catchAsyncError(async (req, res, next) => {
    const data = await Banner.find().sort({ sortOrder: 1 });

    if (!data) {
        return res.status(404).json({ error: "Banner not found" });
    }

    res.status(200).json({
        success: true,
        data
    })
})
// controllers/bannerController.js
exports.updateBanner = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { names, category, subCategory, sortOrders } = req.body;
    const file = req.file;
    const BASE_URL = process.env.NODE_ENV === "production"
        ? `${req.protocol}://${req.get("host")}`
        : process.env.BACKEND_URL;

    let updateData = {
        name: names,
        category: category,
        subCategory: subCategory,
        sortOrder: parseInt(sortOrders) || 0,
    };

    if (file) {
        updateData.imageUrl = `${BASE_URL}/uploads/banner/${file.filename}`;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    if (!updatedBanner) {
        return next(new ErrorHandler("Banner not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Banner updated successfully",
        data: updatedBanner,
    });
});
// DELETE /api/v1/banner/:id
exports.deleteBanner = catchAsyncError(async (req, res, next) => {
    const bannerId = req.params.id;

    const banner = await Banner.findById(bannerId);
    if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await Banner.findByIdAndDelete(bannerId);

    res.status(200).json({
        success: true,
        message: 'Banner deleted successfully',
    });
});
exports.getSingleBanner = catchAsyncError(async (req, res, next) => {
    const bannerId = req.params.id;

    const data = await Banner.findById(bannerId);

    if (!data) {
        return res.status(404).json({
            success: false,
            message: "Banner not found",
        });
    }

    res.status(200).json({
        success: true,
        data,
    });
});



