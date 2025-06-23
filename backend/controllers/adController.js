const catchAsyncError = require('../middlewares/catchAsyncError');
const Ad = require('../models/adModel');
const ErrorHandler = require('../utils/errorHandler');

exports.adUpload = catchAsyncError(async (req, res, next) => {

    const files = req.files;
    const { names, links } = req.body;
    let banners = [];

    let BASE_URL = process.env.BACKEND_URL;
    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${req.get("host")}`;
    }
    
    
    for (let i = 0; i < files.length; i++) {
        if (names[i] && links[i]) {
            banners.push({
                name: names[i],
                link: links[i],
                imageUrl: `${BASE_URL}/uploads/ads/${files[i].filename}`,
            });
        }
    }

    //const data = await Ad.insertMany(banners);
    res.status(201).json({
        success: true,
        data,
    });
});


exports.getAds = catchAsyncError(async (req, res, next) => {

    const data = await Ad.find();

    if (!data) {
        return res.status(404).json({ error: "Banner not found" });
    }
    res.status(200).json({
        success: true,
        data
    })
})
