// ===============================================
// controllers/brandController.js
// ===============================================

const Brand = require("../models/brandModel");

// =====================================
// CREATE BRAND
// =====================================

exports.createBrand = async (req, res) => {

  try {

    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    let image = "";

    if (req.file) {
      image = `${BASE_URL}/uploads/brand/${req.file.filename}`;
    }

    // CHECK EXISTING

    const existingBrand = await Brand.findOne({
      name: req.body.name.trim(),
    });

    if (existingBrand) {
      return res.status(409).json({
        success: false,
        message: "Brand already exists",
      });
    }

    // CREATE

    const brand = await Brand.create({

      name: req.body.name.trim(),

      image,

      Title: req.body.Title || "",

      Description: req.body.Description || "",

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
      message: "Brand created successfully",
      data: brand,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// UPDATE BRAND
// =====================================

exports.updateBrand = async (req, res) => {

  try {

    const brand =
      await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    let image = brand.image;

    if (req.file) {
      image = `${BASE_URL}/uploads/brand/${req.file.filename}`;
    }

    // CHECK DUPLICATE

    const existingBrand =
      await Brand.findOne({
        name: req.body.name.trim(),
        _id: { $ne: req.params.id },
      });

    if (existingBrand) {
      return res.status(409).json({
        success: false,
        message: "Brand already exists",
      });
    }

    // UPDATE

    brand.name =
      req.body.name.trim();

    brand.image =
      image;

    brand.Title =
      req.body.Title || "";

    brand.Description =
      req.body.Description || "";

    brand.isActive =
      req.body.isActive === "true";

    brand.seo = {

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

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// GET ALL BRANDS ADMIN
// =====================================

exports.getAllBrandsAdmin = async (req, res) => {

  try {

    const brands = await Brand.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// GET ACTIVE WEBSITE BRANDS
// =====================================

exports.getWebsiteBrands = async (req, res) => {

  try {

    const brands = await Brand.find({
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// GET SINGLE BRAND
// =====================================

exports.getSingleBrand = async (req, res) => {

  try {

    const brand =
      await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// GET BRAND BY SLUG
// =====================================

exports.getBrandBySlug = async (req, res) => {

  try {

    const brand =
      await Brand.findOne({
        slug: req.params.slug,
        isActive: true,
      });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// TOGGLE BRAND STATUS
// =====================================

exports.toggleBrandStatus = async (req, res) => {

  try {

    const brand =
      await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    brand.isActive =
      !brand.isActive;

    await brand.save();

    res.status(200).json({
      success: true,
      message:
        brand.isActive
          ? "Brand activated"
          : "Brand deactivated",
      data: brand,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =====================================
// DELETE BRAND
// =====================================

exports.deleteBrand = async (req, res) => {

  try {

    const brand =
      await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    await brand.deleteOne();

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};