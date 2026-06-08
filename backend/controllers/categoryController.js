const catchAsyncError = require('../middlewares/catchAsyncError');
const Category = require("../models/categoryModel");
const SubCategory = require("../models/SubCategory");
const Service = require("../models/serviceModel");
const ErrorHandler = require('../utils/errorHandler');

// =====================================
// CREATE CATEGORY
// =====================================

exports.createCategory = catchAsyncError(async (req, res, next) => {

  const BASE_URL =
    process.env.NODE_ENV === "production"
      ? process.env.BACKEND_URL
      : `${req.protocol}://${req.get("host")}`;

  let image = "";

  if (req.file) {
    image = `${BASE_URL}/uploads/category/${req.file.filename}`;
  }

  // CHECK EXISTING
  const existingCategory = await Category.findOne({
    name: req.body.name.trim(),
  });
  console.log(existingCategory);

  if (existingCategory) {
console.log('Category already exists');

    return res.status(409).json({
      success: false,
      message: "Category already exists",
    });

  }

  // CREATE
  const category = await Category.create({

    name: req.body.name.trim(),

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

    message:
      "Category created successfully",

    data: {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      image: category.image,
    },

  });

});

// =====================================
// UPDATE CATEGORY
// =====================================

exports.updateCategory =
  async (req, res) => {
    try {
      const category =
        await Category.findById(
          req.params.id
        );

      if (!category) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Category not found",
          });
      }

      const BASE_URL =
        process.env.NODE_ENV ===
          "production"
          ? process.env
            .BACKEND_URL
          : `${req.protocol}://${req.get(
            "host"
          )}`;

      let image =
        category.image;

      if (req.file) {
        image = `${BASE_URL}/uploads/category/${req.file.filename}`;
      }

      // CHECK DUPLICATE NAME

      const existingCategory =
        await Category.findOne({
          name: req.body.name,
          _id: {
            $ne:
              req.params.id,
          },
        });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message:
            "Category name already exists",
        });
      }

      category.name =
        req.body.name;

      category.image =
        image;

      category.Title =
        req.body.Title;

      category.Description =
        req.body
          .Description;

      category.isFeatured =
        req.body
          .isFeatured ===
        "true";

      category.isActive =
        req.body
          .isActive ===
        "true";

      category.seo = {
        metaTitle:
          req.body
            .metaTitle,

        metaDescription:
          req.body
            .metaDescription,

        metaKeywords:
          req.body.metaKeywords
            ?.split(",")
            .map((item) =>
              item.trim()
            ),

        canonicalUrl:
          req.body
            .canonicalUrl,
      };

      await category.save();

      res.status(200).json({
        success: true,
        message:
          "Category updated successfully",
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================
// GET ALL CATEGORIES ADMIN
// =====================================

exports.getAllCategoriesAdmin =
  async (req, res) => {
    try {
      const categories =
        await Category.find().sort(
          {
            createdAt: -1,
          }
        );

      res.status(200).json({
        success: true,
        count:
          categories.length,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================
// GET ACTIVE WEBSITE CATEGORIES
// =====================================

exports.getWebsiteCategories =
  async (req, res) => {
    try {
      const categories =
        await Category.find({
          isActive: true,
        }).sort({
          createdAt: -1,
        });

      res.status(200).json({
        success: true,
        count:
          categories.length,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================
// GET SINGLE CATEGORY BY ID
// ADMIN
// =====================================

exports.getSingleCategory =
  async (req, res) => {
    try {
      const category =
        await Category.findById(
          req.params.id
        );

      if (!category) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Category not found",
          });
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================
// GET CATEGORY BY SLUG
// WEBSITE
// =====================================

exports.getCategoryBySlug =
  async (req, res) => {
    try {
      const category =
        await Category.findOne({
          slug:
            req.params.slug,
          isActive: true,
        });

      if (!category) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Category not found",
          });
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================
// TOGGLE ACTIVE / INACTIVE
// =====================================

exports.toggleCategoryStatus =
  async (req, res) => {
    try {
      const category =
        await Category.findById(
          req.params.id
        );

      if (!category) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Category not found",
          });
      }

      category.isActive =
        !category.isActive;

      await category.save();

      res.status(200).json({
        success: true,
        message:
          category.isActive
            ? "Category activated"
            : "Category deactivated",
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================
// TOGGLE FEATURED
// =====================================

exports.toggleFeaturedCategory =
  async (req, res) => {
    try {
      const category =
        await Category.findById(
          req.params.id
        );

      if (!category) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Category not found",
          });
      }

      category.isFeatured =
        !category.isFeatured;

      await category.save();

      res.status(200).json({
        success: true,
        message:
          category
            .isFeatured
            ? "Category featured"
            : "Category unfeatured",
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================
// DELETE CATEGORY
// =====================================

exports.deleteCategory =
  async (req, res) => {
    try {
      const category =
        await Category.findById(
          req.params.id
        );

      if (!category) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Category not found",
          });
      }

      await category.deleteOne();

      res.status(200).json({
        success: true,
        message:
          "Category deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

  exports.getNavbarMenu = async (req, res) => {
  try {
    const [categories, subCategories, services] =
      await Promise.all([
        Category.find({ isActive: true })
          .select("name slug")
          .lean(),

        SubCategory.find({ isActive: true })
          .select("name slug category")
          .lean(),

        Service.find({ isActive: true })
          .select("name slug")
          .sort({ displayOrder: 1 })
          .lean(),
      ]);

    const menu = [
      ...categories.map((category) => ({
        name: category.name,
        href: `/products/${category.slug}`,
        submenu: subCategories
          .filter(
            (sub) =>
              sub.category.toString() ===
              category._id.toString()
          )
          .map((sub) => ({
            name: sub.name,
            href: `/products/${category.slug}/${sub.slug}`,
          })),
      })),

      {
        name: "Services",
        href: "/services",
        submenu: services.map((service) => ({
          name: service.name,
          href: `/services/${service.slug}`,
        })),
      },

      // {
      //   name: "About Us",
      //   href: "/about",
      // },

      {
        name: "Contact",
        href: "/contact",
      },
    ];

    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};