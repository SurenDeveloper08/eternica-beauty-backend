const express = require('express');
const multer = require('multer');
const path = require('path')

const { 
    bannerUpload,
    getBanners,
    deleteBanner,
    getSingleBanner,
    updateBanner
 } = require('../controllers/bannerController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')


const upload = multer({storage: multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join( __dirname,'..' , 'uploads/banner' ) )
    },
    filename: function(req, file, cb ) {
        cb(null, file.originalname)
    }
}) })


router.route('/banners/getall').get(getBanners);

//Admin routes
router.route('/admin/banners/upload').post(isAuthenticatedUser,authorizeRoles('admin'), upload.array('images'), bannerUpload); 
router.route('/admin/banners/:id').get(isAuthenticatedUser,authorizeRoles('admin'), getSingleBanner);
router.route('/admin/banners/:id').put(isAuthenticatedUser,authorizeRoles('admin'), upload.single('images'), updateBanner);
router.route('/admin/banner/all').get(isAuthenticatedUser,authorizeRoles('admin') ,getBanners);
router.route('/admin/banner/:id').delete(isAuthenticatedUser,authorizeRoles('admin'), deleteBanner);
module.exports = router;