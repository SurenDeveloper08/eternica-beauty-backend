// controllers/categoryController.js
const Category = require('../models/categoryModel');
const slugify = require('slugify');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require('../middlewares/catchAsyncError')
const APIFeatures = require('../utils/apiFeatures');

exports.createCategory = catchAsyncError(async (req, res, next) => {
  const { name, sortOrder } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  const subcategories = JSON.parse(req.body.subcategories || "[]");

  // Remove empty subcategories & format
  let validSubcats = subcategories
    .filter((sub) => sub.name && sub.name.trim() !== "")
    .map((sub, index) => ({
      name: sub.name.trim(),
      slug: slugify(sub.name.trim(), { lower: true, strict: true }),
      sortOrder: sub.sortOrder || index  // fallback to index if not provided
    }));

  // Sort by sortOrder before saving
  validSubcats = validSubcats.sort((a, b) => a.sortOrder - b.sortOrder);

  // Check for duplicate slugs
  const slugs = validSubcats.map((s) => s.slug);
  const hasDuplicates = new Set(slugs).size !== slugs.length;
  if (hasDuplicates) {
    return res.status(400).json({
      success: false,
      message: "Duplicate subcategory names/slugs found.",
    });
  }

  let BASE_URL = process.env.BACKEND_URL;
  if (process.env.NODE_ENV === "production") {
    BASE_URL = `${req.protocol}://${req.get("host")}`;
  }

  let image = "";
  if (req.file) {
    image = `${BASE_URL}/uploads/category/${req.file.filename}`;
  }
  let seo = {
    metaTitle: req.body.metaTitle || '',
    metaDescription: req.body.metaDescription || '',
    metaKeywords: req.body.metaKeywords || '',
    canonicalUrl: req.body.canonicalUrl || ''
  };

  const category = await Category.create({
    name,
    slug,
    image,
    sortOrder,
    subcategories: validSubcats,
    seo
  });

  res.status(201).json({ success: true, category });
});
exports.getActiveCategories = async (req, res) => {
  try {
    // Find active categories sorted by sortOrder (assume you have sortOrder field in category)
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1 }) // sort categories ascending by sortOrder
      .lean();

    // Filter active subcategories and sort them by sortOrder as well
    const filtered = categories.map(cat => ({
      ...cat,
      subcategories: (cat.subcategories || [])
        .filter(sub => sub.isActive)           // keep only active subcategories
        .sort((a, b) => a.sortOrder - b.sortOrder), // sort by sortOrder
    }));

    res.status(200).json({
      success: true,
      data: filtered,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const data = await Category.find().sort({ sortOrder: 1 });
    res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addSubcategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    // Parse subcategories JSON string
    const subcategories = JSON.parse(req.body.subcategories);

    if (!Array.isArray(subcategories) || subcategories.length === 0) {
      return res.status(400).json({ error: "At least one subcategory is required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    let BASE_URL = process.env.BACKEND_URL;
    if (process.env.NODE_ENV === "production") {
      BASE_URL = `${req.protocol}://${req.get("host")}`;
    }

   
   subcategories.forEach(sub => {
  if (!sub.name) {
    throw new Error("Each subcategory must have a name");
  }

  // Use uploaded image if available, else fallback to sub.image (only if it's a string)
  const subImage =
    req.file
      ? `${BASE_URL}/uploads/category/${req.file.filename}`
      : typeof sub.image === "string"
        ? sub.image
        : "";

  category.subcategories.push({
    name: sub.name,
    image: subImage,
    slug: slugify(sub.name, { lower: true, strict: true }),
    sortOrder: sub.sortOrder || 0,
    seo: sub.seo || {}
  });
});


    await category.save();

    return res.status(201).json({
      success: true,
      message: "Subcategories added successfully",
      category,
    });

  } catch (error) {
    console.error("Add Subcategory Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSubcategory = async (req, res) => {
  const { categorySlug } = req.params;
  
  try {
    const subcategories = await Category.findOne({slug: categorySlug});
    res.status(201).json({
      success: true,
      data: subcategories.subcategories
    })
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ error: "Failed to fetch subcategories" });
  }
};
exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  const categoryId = req.params.id;

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Banner not found' });
  }

  await Category.findByIdAndDelete(categoryId);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});
exports.getSingleCategory = catchAsyncError(async (req, res, next) => {
  const categoryId = req.params.id;

  const data = await Category.findById(categoryId);

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  res.status(200).json({
    success: true,
    data,
  });
});
exports.getAllSubcategories = async (req, res) => {
  try {
    // Fetch only subcategories and category name
    const categories = await Category.find({}, { name: 1, subcategories: 1 }).lean();

    const allSubcategories = [];

    categories.forEach((cat) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach((sub) => {
          allSubcategories.push({
            ...sub,
            categoryId: cat._id,
            categoryName: cat.name,
          });
        });
      }
    });

    // Sort all subcategories by sortOrder
    allSubcategories.sort((a, b) => a.sortOrder - b.sortOrder);

    res.status(200).json({
      success: true,
      count: allSubcategories.length,
      data: allSubcategories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.updateCategory = catchAsyncError(async (req, res, next) => {
  const { name, sortOrder: categorySortOrder } = req.body;

  const { id } = req.params;

  let BASE_URL = process.env.BACKEND_URL;
  if (process.env.NODE_ENV === "production") {
    BASE_URL = `${req.protocol}://${req.get("host")}`;
  }

  let image;
  if (req.file) {
    image = `${BASE_URL}/uploads/category/${req.file.filename}`;
  }
  const slug = slugify(name, { lower: true, strict: true });
  let seo = {
    metaTitle: req.body.metaTitle || '',
    metaDescription: req.body.metaDescription || '',
    metaKeywords: req.body.metaKeywords || '',
    canonicalUrl: req.body.canonicalUrl || ''
  };
  // Prepare update object
  const updateData = {
    name,
    slug,
    sortOrder: categorySortOrder ?? 0,
    seo
  };

  if (image) {
    updateData.image = image;
  }

  const category = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  res.status(200).json({ success: true, category });
});
exports.updateCategoryStatus = catchAsyncError(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.status(200).json({ success: true, category });
});
exports.updateSubcategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { name, sortOrder } = req.body;
    let BASE_URL = process.env.BACKEND_URL;
    if (process.env.NODE_ENV === "production") {
      BASE_URL = `${req.protocol}://${req.get("host")}`;
    }

    let image;
    if (req.file) {
      image = `${BASE_URL}/uploads/category/${req.file.filename}`;
    }

    const seo = typeof req.body.seo === 'string' ? JSON.parse(req.body.seo) : req.body.seo;

    // Find the main category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }
    // Find the specific subcategory inside the category
    const subcategory = category.subcategories.id(subCategoryId);
    if (!subcategory) {
      return res.status(404).json({ success: false, error: "Subcategory not found" });
    }
    // Update subcategory fields
    if (image) {
      subcategory.image = image;
    }
    subcategory.name = name;
    subcategory.slug = slugify(name, { lower: true, strict: true });
    if (sortOrder !== undefined) subcategory.sortOrder = sortOrder;
    if (seo) {
      subcategory.seo = {
        metaTitle: seo.metaTitle || '',
        metaDescription: seo.metaDescription || '',
        metaKeywords: seo.metaKeywords || '',
        canonicalUrl: seo.canonicalUrl || ''
      };
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      data: subcategory,
    });
  } catch (err) {
    console.error("Subcategory update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.updateSubcategoryStatus = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { isActive } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const subcategory = category.subcategories.id(subCategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    subcategory.isActive = isActive;
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Subcategory ${isActive ? 'activated' : 'deactivated'} successfully`,
      subcategory,
    });
  } catch (error) {
    console.error("Update Subcategory Status Error:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.getSingleSubcategory = async (req, res, next) => {
  try {
    const { categoryId, subCategoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subCategoryId);

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }
    res.status(200).json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    console.error("Get Subcategory Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteSubCategory = async (req, res) => {
  const { categoryId, subCategoryId } = req.params;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Remove subcategory by its _id
    category.subcategories = category.subcategories.filter(
      sub => sub._id.toString() !== subCategoryId
    );

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Subcategory deleted successfully',
    });
  } catch (error) {
    console.error("Delete SubCategory Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



