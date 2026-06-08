// ===============================================
// routes/brandRoutes.js
// ===============================================

const express = require("express");
const multer = require("multer");
const path = require("path");

const {

    createBrand,
    updateBrand,
    getAllBrandsAdmin,
    getWebsiteBrands,
    getSingleBrand,
    getBrandBySlug,
    toggleBrandStatus,
    deleteBrand,

} = require("../controllers/brandController");

const router = express.Router();

// =====================================
// MULTER
// =====================================

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '..', '/uploads/brand'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
// =====================================
// CREATE BRAND
// =====================================

router.route("/brand/new").post(
    upload.single("image"),
    createBrand
);

// =====================================
// UPDATE BRAND
// =====================================

router.route("/brand/:id").put(
    upload.single("image"),
    updateBrand
);

// =====================================
// DELETE BRAND
// =====================================

router.route("/brand/:id").delete(
    deleteBrand
);

// =====================================
// GET SINGLE BRAND
// =====================================

router.route("/brand/:id").get(
    getSingleBrand
);

// =====================================
// GET ALL BRANDS ADMIN
// =====================================

router.route("/admin/brand/all").get(
    getAllBrandsAdmin
);

// =====================================
// GET WEBSITE BRANDS
// =====================================

router.route("/brands").get(
    getWebsiteBrands
);

// =====================================
// GET BRAND BY SLUG
// =====================================

router.route("/brand/slug/:slug").get(
    getBrandBySlug
);

// =====================================
// TOGGLE STATUS
// =====================================

router.route("/brand/status/:id").patch(
    toggleBrandStatus
);

module.exports = router;