const express = require('express');
const { newReview, getReviews, getRating, checkIfPurchased } = require('../controllers/reviewController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/review/add').post(isAuthenticatedUser, newReview);
router.route('/review/check-purchase/:productId').get(isAuthenticatedUser, checkIfPurchased);
router.route('/review/:productId').get(getReviews);
router.route('/review/stats/:productId').get(getRating);

module.exports = router;