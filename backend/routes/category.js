// routes/categoryRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path')

const {
  createCategory,
  updateCategory,
  getAllCategoriesAdmin,
  getWebsiteCategories,
  getSingleCategory,
  getCategoryBySlug,
  toggleCategoryStatus,
  toggleFeaturedCategory,
  deleteCategory,
  getNavbarMenu
} = require("../controllers/categoryController");
const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '..', '/uploads/category'))
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
})

// ==============================
// CREATE CATEGORY
// ==============================
router.route('/category/new').post(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  upload.single("image"),
  createCategory
);

// ==============================
// UPDATE CATEGORY
// ==============================

router.route('/category/:id').put(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  upload.single("image"),
  updateCategory
);

router.route('/navbar').get(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  getNavbarMenu
);

// ==============================
// GET ALL CATEGORIES FOR ADMIN
// ==============================
router.route('/admin/category/all').get(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  getAllCategoriesAdmin
);

// ==============================
// GET ACTIVE CATEGORIES WEBSITE
// ==============================
router.route('/website/all').get(
  getWebsiteCategories
);

// ==============================
// GET CATEGORY BY SLUG
// WEBSITE
// ==============================
router.route('/slug/:slug').get(
  getCategoryBySlug
);

// ==============================
// GET SINGLE CATEGORY BY ID
// ADMIN
// ==============================
router.route('/category/:id').get(
  // isAuthenticatedUser, authorizeRoles('admin'),
  getSingleCategory
);


// ==============================
// ACTIVE / INACTIVE
// ==============================
router.route('/category/status/:id').patch(
  // isAuthenticatedUser, authorizeRoles('admin'),
  toggleCategoryStatus
);

// ==============================
// FEATURE / UNFEATURE
// ==============================
router.route('category/featured/:id').patch(
  // isAuthenticatedUser, authorizeRoles('admin'),
  toggleFeaturedCategory
);

// ==============================
// DELETE CATEGORY
// ==============================
 router.route('/category/:id').delete(
  // isAuthenticatedUser, authorizeRoles('admin'),
  deleteCategory
);


module.exports = router;