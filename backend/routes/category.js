// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path')

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

const {
    createCategory,
    getActiveCategories,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    getSingleSubcategory,
    updateSubcategory,
    addSubcategory,
    getSubcategory,
    getAllSubcategories,
    updateCategoryStatus,
    deleteCategory,
    deleteSubCategory,
    updateSubcategoryStatus
} = require('../controllers/categoryController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/categories').get(getActiveCategories);

router.route('/admin/categories/all').get(isAuthenticatedUser, authorizeRoles('admin'), getAllCategories);
router.route('/admin/category/:id').get(isAuthenticatedUser, authorizeRoles('admin'), getSingleCategory);
router.route('/admin/categories').post(isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), createCategory);
router.route('/admin/categories/:id').put(isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), updateCategory);
router.route('/admin/category/status/:id').put(isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), updateCategoryStatus);
router.route('/admin/subcategory/:categoryId').post(isAuthenticatedUser, authorizeRoles('admin'),upload.none(), addSubcategory);
router.route('/admin/subcategories/all').get(isAuthenticatedUser, authorizeRoles('admin'), getAllSubcategories);
router.route('/admin/category/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);
router.route('/admin/subcategory/:categoryId/:subCategoryId').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteSubCategory);
router.route('/categories/subcategory/:categoryId').get(getSubcategory);
router.route('/admin/subcategory/:categoryId/:subCategoryId').put(isAuthenticatedUser, authorizeRoles('admin'),upload.none(), updateSubcategory);
router.route('/admin/subcategory/:categoryId/:subCategoryId/status').put(isAuthenticatedUser, authorizeRoles('admin'),updateSubcategoryStatus);
router.route('/admin/subcategory/:categoryId/:subCategoryId').get(isAuthenticatedUser, authorizeRoles('admin'), getSingleSubcategory);

module.exports = router;