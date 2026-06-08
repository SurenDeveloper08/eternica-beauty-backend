// controllers/subCategoryController.js

const SubCategory = require("../models/SubCategory");
const Category = require("../models/categoryModel");

// =====================================
// CREATE SUBCATEGORY
// =====================================

// =====================================
// CREATE SUBCATEGORY
// =====================================

exports.createSubCategory = async (req, res) => {

  try {

    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    let image = "";

    if (req.file) {
      image = `${BASE_URL}/uploads/subcategory/${req.file.filename}`;
    }

    // CHECK CATEGORY

    const category = await Category.findById(req.body.category);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // CHECK EXISTING SUBCATEGORY

    const existingSubCategory = await SubCategory.findOne({
      name: req.body.name.trim(),
    });

    if (existingSubCategory) {
      return res.status(409).json({
        success: false,
        message: "Subcategory already exists",
      });
    }

    // CREATE

    const subCategory = await SubCategory.create({

      name: req.body.name.trim(),

      category: req.body.category,

      image,

      Title: req.body.Title || "",

      Description: req.body.Description || "",

      isFeatured:
        req.body.isFeatured === "true",

      isActive:
        req.body.isActive === "true",

      seo: {

        metaTitle:
          req.body.metaTitle || "",

        metaDescription:
          req.body.metaDescription || "",

        metaKeywords:
          req.body.metaKeywords
            ? req.body.metaKeywords
              .split(",")
              .map((item) => item.trim())
            : [],

        canonicalUrl:
          req.body.canonicalUrl || "",

      },

    });

    res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      data: subCategory,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// UPDATE SUBCATEGORY
// =====================================

// =====================================
// UPDATE SUBCATEGORY
// =====================================

exports.updateSubCategory = async (req, res) => {

  try {

    const subCategory =
      await SubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    let image = subCategory.image;

    if (req.file) {
      image = `${BASE_URL}/uploads/subcategory/${req.file.filename}`;
    }

    // CHECK CATEGORY

    const category = await Category.findById(req.body.category);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // CHECK DUPLICATE

    const existingSubCategory =
      await SubCategory.findOne({
        name: req.body.name.trim(),
        _id: { $ne: req.params.id },
      });

    if (existingSubCategory) {
      return res.status(409).json({
        success: false,
        message: "Subcategory already exists",
      });
    }

    // UPDATE

    subCategory.name =
      req.body.name.trim();

    subCategory.category =
      req.body.category;

    subCategory.image =
      image;

    subCategory.Title =
      req.body.Title || "";

    subCategory.Description =
      req.body.Description || "";

    subCategory.isFeatured =
      req.body.isFeatured === "true";

    subCategory.isActive =
      req.body.isActive === "true";

    subCategory.seo = {

      metaTitle:
        req.body.metaTitle || "",

      metaDescription:
        req.body.metaDescription || "",

      metaKeywords:
        req.body.metaKeywords
          ? req.body.metaKeywords
              .split(",")
              .map((item) => item.trim())
          : [],

      canonicalUrl:
        req.body.canonicalUrl || "",

    };

    await subCategory.save();

    res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      data: subCategory,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// GET ALL SUBCATEGORIES ADMIN
// =====================================

exports.getAllSubCategoriesAdmin = async (req, res) => {

  try {

    const subCategories = await SubCategory.find()
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// GET WEBSITE SUBCATEGORIES
// =====================================

exports.getWebsiteSubCategories = async (req, res) => {

  try {

    const subCategories = await SubCategory.find({
      isActive: true,
    })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// GET SINGLE SUBCATEGORY
// =====================================

exports.getSingleSubCategory = async (req, res) => {

  try {

    const subCategory = await SubCategory.findById(req.params.id)
      .populate("category", "name slug");

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subCategory,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// GET SUBCATEGORY BY SLUG
// =====================================

exports.getSubCategoryBySlug = async (req, res) => {

  try {

    const subCategory = await SubCategory.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate("category", "name slug");

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subCategory,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// GET SUBCATEGORIES BY CATEGORY
// =====================================

exports.getSubCategoriesByCategory = async (req, res) => {

  try {

    const subCategories = await SubCategory.find({
      category: req.params.categoryId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// TOGGLE STATUS
// =====================================

exports.toggleSubCategoryStatus = async (req, res) => {

  try {

    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    subCategory.isActive = !subCategory.isActive;

    await subCategory.save();

    res.status(200).json({
      success: true,
      message:
        subCategory.isActive
          ? "Subcategory activated"
          : "Subcategory deactivated",
      data: subCategory,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// TOGGLE FEATURED
// =====================================

exports.toggleFeaturedSubCategory = async (req, res) => {

  try {

    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    subCategory.isFeatured = !subCategory.isFeatured;

    await subCategory.save();

    res.status(200).json({
      success: true,
      message:
        subCategory.isFeatured
          ? "Subcategory featured"
          : "Subcategory unfeatured",
      data: subCategory,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// DELETE SUBCATEGORY
// =====================================

exports.deleteSubCategory = async (req, res) => {

  try {

    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    await subCategory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// GET SUBCATEGORIES BY CATEGORY
// =====================================

exports.getSubCategoriesByCategory = async (req, res) => {

  try {

    const subCategories =
      await SubCategory.find({
        category: req.params.category,
        isActive: true,
      })
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};