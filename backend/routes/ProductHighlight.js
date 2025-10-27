const express = require('express');
const multer = require('multer');
const path = require('path')

const {
    createProductHighlight,
    getProductHighlightById,
    toggleProductHighlightStatus,
    updateProductHighlight,
    getAllProductHighlights,
    getActiveHighlightedProducts,
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
const upload = multer();



router.route('/admin/highlight/new').post(
    // isAuthenticatedUser, authorizeRoles('admin'),
    upload.none(),
    createProductHighlight
);
router.route('/admin/highlight/:id').get(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    getProductHighlightById);

router.route('/admin/highlight/status/:id').put(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    toggleProductHighlightStatus);

router.route('/admin/highlight/:id').put(
    // isAuthenticatedUser, authorizeRoles('admin'), 
    upload.none(),
    updateProductHighlight);

router.route('/admin/highlights').get(
    // isAuthenticatedUser, authorizeRoles('admin'),
    getAllProductHighlights);

//user
router.route('/highlights/active').get(
    // isAuthenticatedUser, authorizeRoles('admin'),
    getActiveHighlightedProducts);
module.exports = router;