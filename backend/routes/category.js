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
    getActiveSubByCat,
    getActiveCategories,
    getAdminCategories,
    getAdminCategory,
    updateCategory,
    getAdminSubcategory,
    toggleCategoryActive,
    toggleSubCategoryActive,
    updateSubCategory,
    getActiveCategoriesWithSubcategories,
    getActiveMaincategories,
    getSingleSubcategory,
    createSubcategory,
    getSubcategory,
    getAdminSubCategories,
    getHomeMaincategories,
    updateCategoryStatus,
    deleteCategory,
    deleteSubCategory,
    updateSubcategoryStatus,
    getActiveSubCategories
} = require('../controllers/categoryController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/categories').get(getActiveCategories); //used
router.route('/filtersubbycat').get(getActiveSubByCat);

router.route('/admin/categories/all').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminCategories);
router.route('/admin/categories').post(isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), createCategory);
router.route('/admin/subcategories/all').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminSubCategories);
router.route('/categories/subcategory/:categorySlug').get(getSubcategory);

//admin
router.route('/admin/category/new').post(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    upload.single('image'), createCategory);

router.route('/admin/categories').get(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    getAdminCategories);

router.route('/admin/category/:id').get(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    getAdminCategory);

router.route('/admin/category/:id').put(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    upload.single('image'), updateCategory);

router.route('/admin/category/:id').delete(
    // isAuthenticatedUser, authorizeRoles('admin'),
    deleteCategory);

router.route('/admin/category/status/:categoryId').put(
    // isAuthenticatedUser, authorizeRoles('admin'),
    toggleCategoryActive);

router.route('/admin/active/categories').get(
    //   isAuthenticatedUser, authorizeRoles('admin'), 
    getActiveCategories);
router.route('/admin/subcategory/new/:categoryId').post(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    upload.single('image'), createSubcategory);

router.route('/admin/subcategories').get(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    getAdminSubCategories);
router.route('/admin/subcategory/:categoryId/:subCategoryId').get(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    getAdminSubcategory);

router.route('/admin/subcategory/:categoryId/:subCategoryId').put(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    upload.single('image'), updateSubCategory);

router.route('/admin/subcategory/:categoryId/:subCategoryId').delete(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    deleteSubCategory);

router.route('/admin/active/subcategories/:categoryId').get(
    //   isAuthenticatedUser, authorizeRoles('admin'), 
    getActiveSubCategories);

router.route('/admin/subcategory/status/:categoryId/:subCategoryId').put(
    // isAuthenticatedUser, authorizeRoles('admin'),
    toggleSubCategoryActive);

router.route('/admin/maincategories').get(
    // isAuthenticatedUser, authorizeRoles('admin'),
    getHomeMaincategories);


//user
router.route('/categories/active').get(
    getActiveCategoriesWithSubcategories);

router.route('/maincategories/active').get(
    getActiveMaincategories);
module.exports = router; 