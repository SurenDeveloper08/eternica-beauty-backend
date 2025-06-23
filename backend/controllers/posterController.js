const catchAsyncError = require('../middlewares/catchAsyncError');
const Poster = require('../models/posterModel');
const ErrorHandler = require('../utils/errorHandler');

exports.posterUpload = catchAsyncError(async (req, res, next) => {
    const files = req.files;
    const { names, links } = req.body;
    let banners = [];

    let BASE_URL = process.env.BACKEND_URL;
    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${req.get("host")}`;
    }
    if (files.length > 1) {
        for (let i = 0; i < files.length; i++) {
            if (names[i] && links[i]) {
                banners.push({
                    name: names[i],
                    link: links[i],
                    imageUrl: `${BASE_URL}/uploads/poster/${files[i].filename}`,
                });
            }
        }
    }
    else {
         for (let i = 0; i < files.length; i++) {
            banners.push({
                    name: names,
                    link: links,
                    imageUrl: `${BASE_URL}/uploads/poster/${files[i].filename}`,
                });
        }
    }

    const data = await Poster.insertMany(banners);
    res.status(201).json({
        success: true,
        data,
    });
});


exports.getPosters = catchAsyncError(async (req, res, next) => {

    const data = await Poster.find();

    if (!data) {
        return res.status(404).json({ error: "Banner not found" });
    }
    res.status(200).json({
        success: true,
        data
    })
})
