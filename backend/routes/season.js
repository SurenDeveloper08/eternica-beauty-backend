const express = require('express');
const multer = require('multer');
const path = require('path')

const {
    seasonUpload,
    getSeasons
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

//Admin routes
router.route('/admin/season/upload').post(upload.array('images'), seasonUpload);
router.route('/season/getall').get(getSeasons);

module.exports = router;