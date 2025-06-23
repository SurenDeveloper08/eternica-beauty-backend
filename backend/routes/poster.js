const express = require('express');
const multer = require('multer');
const path = require('path')

const { 
    posterUpload,
    getPosters
 } = require('../controllers/posterController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

const upload = multer({storage: multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join( __dirname,'..' , 'uploads/poster' ) )
    },
    filename: function(req, file, cb ) {
        cb(null, file.originalname)
    }
}) })

//Admin routes
router.route('/admin/poster/upload').post(upload.array('images'), posterUpload);
router.route('/poster/getall').get(getPosters);

module.exports = router;