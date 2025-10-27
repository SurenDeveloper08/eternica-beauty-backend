const express = require('express');
const multer = require('multer');
const path = require('path')

const {
    createSlider,
    getAllSliders,
    getSlider,
    updateSlider,
    deleteSlider,
    toggleSliderActive,
    getActiveSliders,
    bannerUpload,
    getBanners,
    deleteBanner,
    getSingleBanner,
    updateBanner
} = require('../controllers/bannerController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')


const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '..', 'uploads/slider'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})

router.route('/banners/getall').get(getBanners);

router.route('/admin/slider/new').post(
    // isAuthenticatedUser,authorizeRoles('admin'),  + 
    upload.single('image'), createSlider);

router.route('/admin/sliders').get(
    // isAuthenticatedUser,authorizeRoles('admin'),  + 
    getAllSliders);

router.route('/admin/slider/:id').get(
    // isAuthenticatedUser,authorizeRoles('admin'),  + 
    getSlider);

router.route('/admin/slider/:id').put(
    // isAuthenticatedUser,authorizeRoles('admin'),  + 
    upload.single('image'), updateSlider);

router.route('/admin/slider/:id').delete(
    // isAuthenticatedUser,authorizeRoles('admin'),  + 
    deleteSlider);

router.route('/admin/slider/status/:id').put(
    // isAuthenticatedUser,authorizeRoles('admin'),  + 
    toggleSliderActive);

//user
router.route('/sliders/active').get(
    getActiveSliders);
module.exports = router;