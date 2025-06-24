const express = require('express');
const multer = require('multer');
const path = require('path')

const { 
    posterUpload,
    getPosters,
    getPosterById,
    getPostersAdmin,
    updatePoster,
    updatePosterStatus,
    deletePoster
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

//Web routes
router.route('/poster/getall').get(getPosters)

//Admin routes
router.route('/admin/poster/upload').post(isAuthenticatedUser,authorizeRoles('admin'),upload.array('images'), posterUpload);
router.route('/admin/poster/:id').put(isAuthenticatedUser,authorizeRoles('admin'),upload.single('images'), updatePoster);
router.route('/admin/poster/:id').get(isAuthenticatedUser,authorizeRoles('admin'), getPosterById)
router.route('/admin/posters').get(isAuthenticatedUser,authorizeRoles('admin'),getPostersAdmin);
router.route('/admin/poster/status/:id').put(isAuthenticatedUser,authorizeRoles('admin'),updatePosterStatus);
router.route('/admin/poster/:id').delete(isAuthenticatedUser,authorizeRoles('admin'), deletePoster);
module.exports = router;