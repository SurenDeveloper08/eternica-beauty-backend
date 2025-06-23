const express = require('express');
const multer = require('multer');
const path = require('path')

const { 
    adUpload,
    getAds
 } = require('../controllers/adController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

const upload = multer({storage: multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join( __dirname,'..' , 'uploads/ads' ) )
    },
    filename: function(req, file, cb ) {
        cb(null, file.originalname)
    }
}) })


//Admin routes
router.route('/admin/ads/upload').post(upload.array('images'), adUpload);
router.route('/ads/getall').get(getAds);

module.exports = router;