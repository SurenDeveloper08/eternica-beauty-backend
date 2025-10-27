const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const slugify = require('slugify');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require('../middlewares/catchAsyncError')
const APIFeatures = require('../utils/apiFeatures');

//admin
exports.getAdminCategories = catchAsyncError(async (req, res) => {
  try {
    const data = await Category.find().sort({ sortOrder: 1 });

    res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//admin
exports.createCategory = catchAsyncError(async (req, res, next) => {
  const { name, description = '', isActive, sortOrder } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Category name is required.",
    });
  }

  const slug = slugify(name.trim(), { lower: true, strict: true });

  const BASE_URL = process.env.NODE_ENV === "production"
    ? process.env.BACKEND_URL
    : `${req.protocol}://${req.get("host")}`;

  const image = req.file
    ? `${BASE_URL}/uploads/category/${req.file.filename}`
    : '';

  const seo = {
    metaTitle: req.body.metaTitle?.trim() || '',
    metaDescription: req.body.metaDescription?.trim() || '',
    metaKeywords: req.body.metaKeywords?.trim() || '',
    canonicalUrl: req.body.canonicalUrl?.trim() || '',
  };

  const categoryData = {
    name: name.trim(),
    description: description.trim(),
    slug,
    image,
    isActive,
    sortOrder: Number(sortOrder) || 0,
    seo,
  };

  try {
    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      category,
      message: "Category created successfully",
    });

  } catch (error) {
    console.error("Category creation error:", error);
    next(error);
  }
});

//admin
exports.updateCategoryStatus = catchAsyncError(async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate isActive
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: isActive must be a boolean',
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category status updated successfully',
      category,
    });

  } catch (error) {
    console.error('Error updating category status:', error);

    res.status(500).json({
      success: false,
      message: 'Server error while updating category status',
    });
  }
});

//admin
exports.getAdminCategory = catchAsyncError(async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format',
      });
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });

  } catch (error) {
    console.error('Error fetching category:', error);

    res.status(500).json({
      success: false,
      message: 'Server error while fetching category',
    });
  }
});

//admin
exports.updateCategory = catchAsyncError(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }

    const { name, title, description, isActive, sortOrder } = req.body;

    const slug = slugify(name || "", { lower: true, strict: true });

    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    let image;
    if (req.file) {
      image = `${BASE_URL}/uploads/category/${req.file.filename}`;
    }

    const seo = {
      metaTitle: req.body.metaTitle || "",
      metaDescription: req.body.metaDescription || "",
      metaKeywords: req.body.metaKeywords || "",
      canonicalUrl: req.body.canonicalUrl || "",
    };

    const updateData = {
      name,
      title,
      description,
      slug,
      isActive,
      sortOrder: sortOrder ?? 0,
      seo,
    };

    if (image) {
      updateData.image = image;
    }

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });

  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating category",
    });
  }
});

//admin
exports.deleteCategory = catchAsyncError(async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error("Error deleting category:", error);

    return res.status(500).json({
      success: false,
      message: 'Server error while deleting category',
    });
  }
});

//admin
exports.getActiveCategories = catchAsyncError(async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

    const result = categories.map(category => {
      const subcategories = Array.isArray(category.subcategories)
        ? category.subcategories
          .filter(sub => sub?.isActive)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        : [];

      return {
        ...category,
        subcategories,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

//admin
exports.getActiveSubCategories = catchAsyncError(async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    const category = await Category.findOne(
      { slug: categoryId, isActive: true },
      { subcategories: 1, _id: 0 }
    ).lean();

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const activeSubcategories = (category.subcategories || []).filter(sub => sub.isActive);

    return res.status(200).json({
      data: activeSubcategories,
    });

  } catch (err) {
    console.error("Error in getActiveSubByCat:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//admin
exports.createSubcategory = catchAsyncError(async (req, res) => {
  try {
    const { categoryId } = req.params;

    const subcategory = req.body;

    if (!subcategory || !subcategory.name) {
      return res.status(400).json({ error: "Subcategory name is required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const subImage = req.file
      ? `${BASE_URL}/uploads/category/${req.file.filename}`
      : typeof subcategory.image === "string"
        ? subcategory.image
        : "";
    const seo = {
      metaTitle: subcategory.metaTitle?.trim() || '',
      metaDescription: subcategory.metaDescription?.trim() || '',
      metaKeywords: subcategory.metaKeywords?.trim() || '',
      canonicalUrl: subcategory.canonicalUrl?.trim() || '',
    };

    const showOnHome = subcategory.showOnHome === 'true' || subcategory.showOnHome === true;

    // Push the single subcategory
    category.subcategories.push({
      name: subcategory.name,
      title: subcategory.title || subcategory.name,
      description: subcategory.description || "",
      image: subImage,
      slug: slugify(subcategory.name, { lower: true, strict: true }),
      sortOrder: subcategory.sortOrder || 0,
      isActive: subcategory.isActive !== undefined ? subcategory.isActive : true,
      showOnHome,
      seo
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: "Subcategory added successfully",
      category,
    });

  } catch (error) {
    console.error("Add Subcategory Error:", error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
});

//admin
exports.getAdminSubCategories = catchAsyncError(async (req, res) => {
  try {
    const categories = await Category.find({}, { name: 1, subcategories: 1 }).lean();

    const allSubcategories = categories.flatMap(cat => {
      if (!Array.isArray(cat.subcategories)) return [];

      return cat.subcategories.map(sub => ({
        ...sub,
        categoryId: cat._id,
        categoryName: cat.name,
      }));
    });

    allSubcategories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.status(200).json({
      success: true,
      count: allSubcategories.length,
      data: allSubcategories,
    });

  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

//admin
exports.getAdminSubcategory = catchAsyncError(async (req, res, next) => {
  try {
    const { categoryId, subCategoryId } = req.params;

    if (!categoryId || !subCategoryId) {
      return res.status(400).json({ success: false, message: "Category ID and Subcategory ID are required." });
    }

    const category = await Category.findOne(
      { _id: categoryId, "subcategories._id": subCategoryId },
      { "subcategories.$": 1 }
    ).lean();

    if (!category || !category.subcategories.length) {
      return res.status(404).json({ success: false, message: "Category or Subcategory not found" });
    }

    const subcategory = category.subcategories[0];

    res.status(200).json({
      success: true,
      data: subcategory,
    });

  } catch (error) {
    console.error("Get Subcategory Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//admin
exports.updateSubCategory = catchAsyncError(async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { name, sortOrder, title, description, isActive, showOnHome } = req.body;

    if (!name || !title || !description) {
      return res.status(400).json({
        success: false,
        error: "Name, title, and description are required",
      });
    }

    // base URL
    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    // optional new image
    let image;
    if (req.file) {
      image = `${BASE_URL}/uploads/category/${req.file.filename}`;
    }

    // create slug from name
    const slug = slugify(name, { lower: true, strict: true });

    // build updated fields
    const updateFields = {
      "subcategories.$.name": name,
      "subcategories.$.slug": slug,
      "subcategories.$.title": title,
      "subcategories.$.description": description,
      "subcategories.$.isActive": isActive,
      "subcategories.$.sortOrder": sortOrder || 0,
      "subcategories.$.showOnHome": showOnHome === "true" || showOnHome === true,
      "subcategories.$.seo": {
        metaTitle: req.body.metaTitle || "",
        metaDescription: req.body.metaDescription || "",
        metaKeywords: req.body.metaKeywords || "",
        canonicalUrl: req.body.canonicalUrl || "",
      },
    };

    if (image) updateFields["subcategories.$.image"] = image;

    // atomic update of only this subcategory
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: categoryId, "subcategories._id": subCategoryId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        error: "Category or subcategory not found",
      });
    }

    const updatedSub = updatedCategory.subcategories.id(subCategoryId);

    return res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      data: updatedSub,
    });
  } catch (err) {
    console.error("Error updating subcategory:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

//admin
exports.deleteSubCategory = catchAsyncError(async (req, res) => {
  const { categoryId, subCategoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subCategoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category or subcategory ID format",
    });
  }

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subCategoryId);
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    category.subcategories = category.subcategories.filter(sub => sub._id.toString() !== subCategoryId);
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    console.error("Delete SubCategory Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

//admin
exports.toggleCategoryActive = catchAsyncError(async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findOne({ slug: categoryId });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    category.isActive = !category.isActive;
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" is now ${category.isActive ? 'active' : 'inactive'}`,
      category
    });

  } catch (error) {
    console.error("Toggle category active error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

//admin
exports.toggleSubCategoryActive = catchAsyncError(async (req, res) => {
  try {
    const { categoryId: categorySlug, subCategoryId: subSlug } = req.params;

    const category = await Category.findById(categorySlug);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    const sub = category.subcategories.id(subSlug);

    if (!sub) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }
    sub.isActive = !sub.isActive;
    await category.save();

    return res.status(200).json({ success: true, category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

//admin
exports.getHomeMaincategories = catchAsyncError(async (req, res) => {
  try {
    const categories = await Category.find(
      { "subcategories.showOnHome": true },
      {
        _id: 1,
        name: 1,
        slug: 1,
        image: 1,
        subcategories: 1,
      }
    ).lean();

    const homeSubcategories = [];

    for (const category of categories) {
      const matchingSubs = category.subcategories
        .filter((sub) => sub.showOnHome)
        .map((sub) => ({
          ...sub,
          category: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
            image: category.image,
          },
        }));

      homeSubcategories.push(...matchingSubs);
    }

    return res.status(200).json({
      success: true,
      count: homeSubcategories.length,
      data: homeSubcategories,
    });
  } catch (error) {
    console.error("Error fetching home subcategories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

//user
exports.getActiveCategoriesWithSubcategories = catchAsyncError(async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug description image sortOrder subcategories seo')
      .sort({ sortOrder: 1 })
      .lean();

    const filtered = categories.map(category => ({
      ...category,
      subcategories: (category.subcategories || []).filter(sub => sub.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
    }));

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });

  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

//user
exports.getActiveMaincategories = catchAsyncError(async (req, res) => {
  try {
    // Find categories that are active and have at least one subcategory with showOnHome and isActive
    const categories = await Category.find(
      {
        isActive: true,
        "subcategories.showOnHome": true,
        "subcategories.isActive": true
      },
      {
        _id: 1,
        name: 1,
        slug: 1,
        image: 1,
        subcategories: 1,
      }
    ).lean();

    const homeSubcategories = [];

    for (const category of categories) {
      const matchingSubs = category.subcategories
        .filter((sub) => sub.showOnHome && sub.isActive)
        .map((sub) => ({
          ...sub,
          category: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
            image: category.image,
          },
        }));

      homeSubcategories.push(...matchingSubs);
    }

    return res.status(200).json({
      success: true,
      count: homeSubcategories.length,
      data: homeSubcategories,
    });
  } catch (error) {
    console.error("Error fetching home subcategories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

exports.getActiveSubByCat = async (req, res) => {

  try {

    const category = await Category.findOne({ slug: req.query.slug, isActive: true });
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({
      subcategories: category.subcategories.filter(sub => sub.isActive),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

exports.getSubcategory = async (req, res) => {
  const { categorySlug } = req.params;

  // 1. Validate input
  if (!categorySlug || typeof categorySlug !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing category slug',
    });
  }

  try {
    // 2. Fetch category with matching slug
    const category = await Category.findOne({ slug: categorySlug });

    // 3. Check if category exists
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // 4. Return subcategories
    res.status(200).json({
      success: true,
      data: category.subcategories || [], // fallback to empty array
    });

  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subcategories',
    });
  }
};

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

    let BASE_URL = process.env.NODE_ENV === "production"
      ? process.env.BACKEND_URL
      : `${req.protocol}://${req.get("host")}`;

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




