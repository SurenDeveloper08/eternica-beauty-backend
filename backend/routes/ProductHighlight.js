const express = require('express');
const multer = require('multer');
const path = require('path')

const {
    highlightUpload,
    gethighlightsAdmin,
    gethighlights,
    getHighlightById,
    highlightUpdate,
    deleteHighlight,
    updateHighlightStatus
} = require('../controllers/ProductHighlightController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')



//Web routes
router.route('/highlights').get(gethighlights);

//Admin routes
router.route('/admin/highlight/upload').post(isAuthenticatedUser,authorizeRoles('admin'), highlightUpload);
router.route('/admin/highlights').get(isAuthenticatedUser,authorizeRoles('admin'), gethighlightsAdmin);
router.route('/admin/highlights/:id').get(isAuthenticatedUser,authorizeRoles('admin'), getHighlightById);
router.route('/admin/highlight/:id').put(isAuthenticatedUser,authorizeRoles('admin'), highlightUpdate);
router.route('/admin/highlight/status/:id').put(isAuthenticatedUser,authorizeRoles('admin'),updateHighlightStatus);
router.route('/admin/highlight/:id').delete(isAuthenticatedUser,authorizeRoles('admin'), deleteHighlight);
module.exports = router;