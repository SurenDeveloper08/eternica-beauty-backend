const catchAsyncError = require('../middlewares/catchAsyncError');
const Season = require('../models/seasonModel');
const ErrorHandler = require('../utils/errorHandler');

exports.seasonUpload = catchAsyncError(async (req, res, next) => {

    const files = req.files;
    const { names, category, subCategory } = req.body;
    let banners = [];

    let BASE_URL = process.env.BACKEND_URL;
    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${req.get("host")}`;
    }

     const safeNames = Array.isArray(names) ? names : [names];
    const safeCategory = Array.isArray(category) ? category : [category];
    const safeSubCategory = Array.isArray(subCategory) ? subCategory : [subCategory];

    for (let i = 0; i < files.length; i++) {
        if (safeNames[i] && safeCategory[i] && safeSubCategory[i]) {
            banners.push({
                name: safeNames[i],
                category: safeCategory[i],
                subCategory: safeSubCategory[i],
                imageUrl: `${BASE_URL}/uploads/season/${files[i].filename}`,
            });
        }
    }

    const data = await Season.insertMany(banners);
    res.status(201).json({
        success: true,
        data,
    });
});


exports.getSeasons = catchAsyncError(async (req, res, next) => {

    const data = await Season.find();

    if (!data) {
        return res.status(404).json({ error: "Banner not found" });
    }
    res.status(200).json({
        success: true,
        data
    })
})
