const catchAsyncError = require('../middlewares/catchAsyncError');
const Category = require('../models/topcategoryModel');
const ErrorHandler = require('../utils/errorHandler');

exports.CategoryUpload = catchAsyncError(async (req, res, next) => {

    const files = req.files;
     const { name, category, subCategory, sortOrder } = req.body;
    let banners = [];

    
    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

     const safeNames = Array.isArray(name) ? name : [name];
    const safeCategory = Array.isArray(category) ? category : [category];
    const safeSubCategory = Array.isArray(subCategory) ? subCategory : [subCategory];
    const safeSortOrder = Array.isArray(sortOrder) ? sortOrder : [sortOrder];

    for (let i = 0; i < files.length; i++) {
        if (safeNames[i] && safeCategory[i] && safeSubCategory[i]) {
            banners.push({
                name: safeNames[i],
                category: safeCategory[i],
                subCategory: safeSubCategory[i],
                imageUrl: `${BASE_URL}/uploads/topCategory/${files[i].filename}`,
                sortOrder: parseInt(safeSortOrder[i]) || 0,
            });
        }
        else if (safeNames[i] && safeCategory[i] && !safeSubCategory[i]) {
            banners.push({
                name: safeNames[i],
                category: safeCategory[i],
                imageUrl: `${BASE_URL}/uploads/topCategory/${files[i].filename}`,
                sortOrder: parseInt(safeSortOrder[i]) || 0,
            });
        }
    }

    const data = await Category.insertMany(banners);
    res.status(201).json({
        success: true,
        data,
    });
});

exports.getCategorys = catchAsyncError(async (req, res, next) => {

   const data = await Category.find().find({ isActive: true })
        .sort({ sortOrder: 1 })
        .lean();

    if (!data) {
        return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json({
        success: true,
        data
    })
})

exports.getCategorysAdmin = catchAsyncError(async (req, res, next) => {
  const data = await Category.find().sort({ sortOrder: 1 });
    if (!data) {
        return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json({
        success: true,
        data
    })
})

exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const season = await Category.findById(id);

        if (!season) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            data: season,
        });
    } catch (error) {
         res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCategory = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { name, category, subCategory, sortOrder } = req.body;

    
    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const season = await Category.findById(id);
    if (!season) {
        return res.status(404).json({
            success: false,
            message: "Category not found",
        });
    }

    const updatedFields = {
        name,
        category,
        subCategory,
        sortOrder: parseInt(sortOrder) || 0, // default to 0 if empty or invalid
    };

    if (req.file) {
        updatedFields.imageUrl = `${BASE_URL}/uploads/topCategory/${req.file.filename}`;
    }

    const updated = await Category.findByIdAndUpdate(id, updatedFields, { new: true });

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updated,
    });
});

exports.updateCategoryStatus = catchAsyncError(async (req, res, next) => {
    const poster = await Category.findByIdAndUpdate(
        req.params.id,
        { isActive: req.body.isActive },
        { new: true }
    );

    if (!poster) {
        return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, data:poster });
});

exports.deleteCategory = catchAsyncError(async (req, res, next) => {
   const seasonId = req.params.id;

    const season = await Category.findById(seasonId);
    if (!season) {
        return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.findByIdAndDelete(seasonId);

    res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
    });
});
