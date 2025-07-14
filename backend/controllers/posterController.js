const catchAsyncError = require('../middlewares/catchAsyncError');
const Poster = require('../models/posterModel');
const ErrorHandler = require('../utils/errorHandler');

exports.posterUpload = catchAsyncError(async (req, res, next) => {
    const files = req.files;
    const { names, links, isActives, sortOrders } = req.body;

    let banners = [];

    
    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    if (files.length > 1) {
        for (let i = 0; i < files.length; i++) {
            banners.push({
                name: names[i],
                link: links[i],
                imageUrl: `${BASE_URL}/uploads/poster/${files[i].filename}`,
                isActive: isActives ? isActives[i] === "true" : true,
                sortOrder: sortOrders ? parseInt(sortOrders[i]) || 0 : 0
            });
        }
    } else {
        banners.push({
            name: names,
            link: links,
            imageUrl: `${BASE_URL}/uploads/poster/${files[0].filename}`,
            isActive: isActives ? isActives === "true" : true,
            sortOrder: sortOrders ? parseInt(sortOrders) || 0 : 0
        });
    }

    const data = await Poster.insertMany(banners);
    res.status(201).json({
        success: true,
        data,
    });
});
exports.getPosterById = async (req, res) => {
    try {
        const { id } = req.params;
        const poster = await Poster.findById(id);

        if (!poster) {
            return res.status(404).json({
                success: false,
                message: "Poster not found",
            });
        }

        res.status(200).json({
            success: true,
            data: poster,
        });
    } catch (error) {
        console.error("Get Poster Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPosters = catchAsyncError(async (req, res, next) => {

    const data = await Poster.find().find({ isActive: true })
        .sort({ sortOrder: 1 })
        .lean();

    if (!data) {
        return res.status(404).json({ error: "Banner not found" });
    }
    res.status(200).json({
        success: true,
        data
    })
})
exports.getPostersAdmin = catchAsyncError(async (req, res, next) => {
    const data = await Poster.find().sort({ sortOrder: 1 });

    if (!data) {
        return res.status(404).json({ error: "Banner not found" });
    }
    res.status(200).json({
        success: true,
        data
    })
})
exports.updatePoster = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { name, link, isActive, sortOrder } = req.body;

    
    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const updateData = {
        name,
        link,
        sortOrder: parseInt(sortOrder) || 0,
    };

    // If new image uploaded
    if (req.file) {
        updateData.imageUrl = `${BASE_URL}/uploads/poster/${req.file.filename}`;
    }

    const updated = await Poster.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    if (!updated) {
        return res.status(404).json({ success: false, message: "Poster not found" });
    }

    res.status(200).json({
        success: true,
        message: "Poster updated successfully",
        data: updated,
    });
});
exports.updatePosterStatus = catchAsyncError(async (req, res, next) => {
 
    const poster = await Poster.findByIdAndUpdate(
        req.params.id,
        { isActive: req.body.isActive },
        { new: true }
    );

    if (!poster) {
        return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, data:poster });
});
exports.deletePoster = catchAsyncError(async (req, res, next) => {
    const bannerId = req.params.id;

    const poster = await Poster.findById(bannerId);
    if (!poster) {
        return res.status(404).json({ success: false, message: 'Poster not found' });
    }

    await Poster.findByIdAndDelete(bannerId);

    res.status(200).json({
        success: true,
        message: 'Poster deleted successfully',
    });
});
