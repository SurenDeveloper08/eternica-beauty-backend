const express = require('express');
const multer = require('multer');
const path = require('path')

const {
    createPageContent,
    getPageContent,
    updatePageContent
} = require('../controllers/pageController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '..', 'uploads/page'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})

router.route('/admin/page').post(
    // isAuthenticatedUser,authorizeRoles('admin'), 
    upload.single('image'), createPageContent);

router.route('/admin/page/:page').get(
    // isAuthenticatedUser,authorizeRoles('admin'), 
    getPageContent);

router.route('/admin/page/:id').put(
    // isAuthenticatedUser,authorizeRoles('admin'), 
    upload.single('image'), updatePageContent);

module.exports = router;