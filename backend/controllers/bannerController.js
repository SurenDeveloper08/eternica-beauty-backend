const catchAsyncError = require('../middlewares/catchAsyncError');
const Banner = require('../models/bannerModel');
const Slider = require('../models/bannerModel');
const ErrorHandler = require('../utils/errorHandler');

//admin
exports.createSlider = catchAsyncError(async (req, res) => {
    try {
  
        const { name, cta, link, position, sortOrder, isActive } = req.body;

        if (!name || !cta || !link || !position || !req.file) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const BASE_URL = process.env.NODE_ENV === "production"
            ? process.env.BACKEND_URL
            : `${req.protocol}://${req.get("host")}`;

        const imagePath = `${BASE_URL}/uploads/slider/${req.file.filename}`;

        const newSlider = await Slider.create({
            name,
            cta,
            link,
            position,
            image: imagePath,
            sortOrder,
            isActive,
        });

        res.status(201).json({ success: true, message: "Slider created successfully", data: newSlider });
    } catch (error) {
        console.error("Create Slider Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//admin
exports.getSlider = catchAsyncError(async (req, res) => {
    try {

        const { id } = req.params;
        const slider = await Slider.findById(id);
        if (!slider) {
            return res.status(404).json({
                success: false,
                message: "Slider not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Slider fetched successfully",
            data: slider,
        });
    } catch (error) {
        console.error("❌ Get Slider By ID Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching slider",
            error: error.message,
        });
    }
});

//admin
exports.getAllSliders = catchAsyncError(async (req, res) => {
    try {
         const sliders = await Slider.find().sort({ sortOrder: 1 });

        if (!sliders.length) {
            return res.status(404).json({
                success: false,
                message: "No sliders found",
            });
        }

        res.status(200).json({
            success: true,
            count: sliders.length,
            message: "Sliders fetched successfully",
            data: sliders,
        });
    } catch (error) {
        console.error("Get Sliders Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//admin
exports.updateSlider =  catchAsyncError(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, cta, link, position, sortOrder, isActive } = req.body;

        let slider = await Slider.findById(id);
        if (!slider) {
            return res.status(404).json({ success: false, message: "Slider not found" });
        }

        const BASE_URL = process.env.NODE_ENV === "production"
            ? process.env.BACKEND_URL
            : `${req.protocol}://${req.get("host")}`;

        if (req.file) {
            slider.image = `${BASE_URL}/uploads/sliders/${req.file.filename}`;
        }

        slider.name = name;
        slider.cta = cta;
        slider.link = link;
        slider.position = position;
        slider.sortOrder = sortOrder;
        slider.isActive = isActive;

        await slider.save();

        res.status(200).json({ success: true, message: "Slider updated successfully", data: slider });
    } catch (error) {
        console.error("Update Slider Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//admin
exports.deleteSlider =  catchAsyncError(async (req, res) => {
    try {

        const { id } = req.params;
        const slider = await Slider.findByIdAndDelete(id);
        if (!slider) {
            return res.status(404).json({ success: false, message: "Slider not found" });
        }
        res.status(200).json({ success: true, message: "Slider deleted successfully" });
    } catch (error) {
        console.error("Delete Slider Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

//admin
exports.toggleSliderActive = catchAsyncError(async (req, res) => {
    try {

        const { id } = req.params;
        const slider = await Slider.findById(id);

        if (!slider) {
            return res.status(404).json({ success: false, message: "Slider not found" });
        }

        slider.isActive = !slider.isActive;

        await slider.save();

        return res.status(200).json({
            success: true,
            message: `slider "${slider.name}" is now ${slider.isActive ? 'active' : 'inactive'}`,
            slider
        });

    } catch (error) {
        console.error("Toggle product active error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


//user
exports.getActiveSliders = catchAsyncError(async (req, res) => {
    try {
        // Fetch sliders where isActive is true
        const sliders = await Slider.find({ isActive: true }).sort({ sortOrder: 1 });

        if (!sliders.length) {
            return res.status(404).json({
                success: false,
                message: "No active sliders found",
            });
        }

        res.status(200).json({
            success: true,
            count: sliders.length,
            message: "Active sliders fetched successfully",
            data: sliders,
        });
    } catch (error) {
        console.error("Get Active Sliders Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

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



