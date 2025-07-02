const express = require('express');
const { newReview, newAdminReview, getAllReviews, deleteAdminReview, getReviewById, updateAdminReview, updateReviewStatus, getReviews, getRating, checkIfPurchased } = require('../controllers/reviewController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/review/add').post(isAuthenticatedUser, newReview);
router.route('/admin/review/new').post(isAuthenticatedUser, authorizeRoles('admin'), newAdminReview);
router.route('/review/check-purchase/:productId').get(isAuthenticatedUser, checkIfPurchased);
router.route('/admin/review').get(isAuthenticatedUser, authorizeRoles('admin'), getAllReviews);
router.route('/admin/review/status/:id').put(isAuthenticatedUser,authorizeRoles('admin'),updateReviewStatus);
router.route('/admin/review/:id').put(isAuthenticatedUser,authorizeRoles('admin'), updateAdminReview);
router.route('/admin/review/:id').get(isAuthenticatedUser,authorizeRoles('admin'), getReviewById);
router.route('/admin/review/:id').delete(isAuthenticatedUser,authorizeRoles('admin'), deleteAdminReview);
router.route('/review/:productId').get(getReviews);
router.route('/review/stats/:productId').get(getRating);

module.exports = router;