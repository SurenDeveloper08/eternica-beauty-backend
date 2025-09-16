const express = require('express');
const multer = require('multer');
const path = require('path')

const {
    CategoryUpload,
    getCategorys,
    getCategorysAdmin,
    getCategoryById,
    updateCategory,
    updateCategoryStatus,
    deleteCategory
} = require('../controllers/topCategoryController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '..', 'uploads/topCategory'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})

//Web routes
router.route('/topcat/getall').get(getCategorys);

//Admin routes
router.route('/admin/topcat/upload').post(upload.array('images'), CategoryUpload);
router.route('/admin/topcat/getall').get(isAuthenticatedUser,authorizeRoles('admin'),getCategorysAdmin);
router.route('/admin/topcat/:id').get(isAuthenticatedUser,authorizeRoles('admin'),upload.array('images'), getCategoryById);
router.route('/admin/topcat/:id').put(isAuthenticatedUser,authorizeRoles('admin'),upload.single('images'), updateCategory);
router.route('/admin/topcat/status/:id').put(isAuthenticatedUser,authorizeRoles('admin'),updateCategoryStatus);
router.route('/admin/topcat/:id').delete(isAuthenticatedUser,authorizeRoles('admin'), deleteCategory);
module.exports = router;