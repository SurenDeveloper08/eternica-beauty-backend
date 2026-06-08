// routes/subCategoryRoutes.js

const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    createSubCategory,
    updateSubCategory,
    getAllSubCategoriesAdmin,
    getWebsiteSubCategories,
    getSingleSubCategory,
    getSubCategoryBySlug,
    getSubCategoriesByCategory,
    toggleSubCategoryStatus,
    toggleFeaturedSubCategory,
    deleteSubCategory,
} = require("../controllers/subCategoryController");

const router = express.Router();

// =====================================
// MULTER
// =====================================

const upload = multer({
    storage: multer.diskStorage({

        destination: function (req, file, cb) {

            cb(
                null,
                path.join(
                    __dirname,
                    "..",
                    "/uploads/subcategory"
                )
            );

        },

        filename: function (req, file, cb) {

            cb(null, file.originalname);

        },

    }),
});

// =====================================
// CREATE
// =====================================

router.post(
    "/subcategory/new",
    upload.single("image"),
    createSubCategory
);

// =====================================
// UPDATE
// =====================================

router.put(
    "/subcategory/:id",
    upload.single("image"),
    updateSubCategory
);

// =====================================
// DELETE
// =====================================

router.delete(
    "/subcategory/:id",
    deleteSubCategory
);

// =====================================
// GET ALL ADMIN
// =====================================

router.get(
    "/admin/subcategory/all",
    getAllSubCategoriesAdmin
);

// =====================================
// GET WEBSITE ALL
// =====================================

router.get(
    "/website/subcategory/all",
    getWebsiteSubCategories
);

// =====================================
// GET SINGLE
// =====================================

router.get(
    "/subcategory/:id",
    getSingleSubCategory
);

// =====================================
// GET BY SLUG
// =====================================

router.get(
    "/subcategory/slug/:slug",
    getSubCategoryBySlug
);

// =====================================
// GET BY CATEGORY
// =====================================

router.get(
    "/website/subcategory/category/:categoryId",
    getSubCategoriesByCategory
);

// =====================================
// TOGGLE STATUS
// =====================================

router.patch(
    "/subcategory/status/:id",
    toggleSubCategoryStatus
);

// =====================================
// TOGGLE FEATURED
// =====================================

router.patch(
    "/subcategory/featured/:id",
    toggleFeaturedSubCategory
);

// =====================================
// GET SUBCATEGORIES BY CATEGORY
// =====================================

router.route(
  "/subcategories/category/:category"
).get(
  getSubCategoriesByCategory
);
module.exports = router;