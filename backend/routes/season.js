const express = require('express');
const multer = require('multer');
const path = require('path')

const {
    seasonUpload,
    getSeasons,
    getSeasonsAdmin,
    getSeasonById,
    updateSeason,
    updateSeasonStatus,
    deleteSeason
} = require('../controllers/seasonController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '..', 'uploads/season'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})

//Web routes
router.route('/season/getall').get(getSeasons);

//Admin routes
router.route('/admin/season/upload').post(upload.array('images'), seasonUpload);
router.route('/admin/season/getall').get(isAuthenticatedUser,authorizeRoles('admin'),upload.array('images'), getSeasonsAdmin);
router.route('/admin/season/:id').get(isAuthenticatedUser,authorizeRoles('admin'),upload.array('images'), getSeasonById);
router.route('/admin/season/:id').put(isAuthenticatedUser,authorizeRoles('admin'),upload.single('images'), updateSeason);
router.route('/admin/season/status/:id').put(isAuthenticatedUser,authorizeRoles('admin'),updateSeasonStatus);
router.route('/admin/season/:id').delete(isAuthenticatedUser,authorizeRoles('admin'), deleteSeason);
module.exports = router;