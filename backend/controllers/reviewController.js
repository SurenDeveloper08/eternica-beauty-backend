const catchAsyncError = require('../middlewares/catchAsyncError');
const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/errorHandler');
function formatNames(input) {
    return input
        .split(',')
        .map(name =>
            name
                .trim()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')
        )
        .join(', ');
}


exports.newReview = catchAsyncError(async (req, res, next) => {
    try {
        const { productId, rating, comment } = req.body;
 if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const review = new Review({
            productId,
            userId: req.user.id,
            name: formatNames(req.user.name), // from token
            rating,
            comment
        });

        await review.save();

        res.status(201).json({ success: true, message: 'Review added successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error submitting review' });
    }
});

exports.getReviews = catchAsyncError(async (req, res, next) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
})

exports.getRating = catchAsyncError(async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const reviews = await Review.find({ productId });

        const totalReviews = reviews.length;
        const averageRating =
            reviews.reduce((sum, r) => sum + r.rating, 0) / (totalReviews || 1);

        // Initialize ratingDistribution object
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        // Fill it from reviews
        reviews.forEach(r => {
            if (ratingDistribution[r.rating] !== undefined) {
                ratingDistribution[r.rating]++;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalReviews,
                averageRating: Number(averageRating.toFixed(1)),
                ratingDistribution,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error getting stats' });
    }
});

// controllers/reviewController.js
exports.checkIfPurchased = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const productId = req.params.productId;

  // Check if a delivered order exists for the user containing the product
  const order = await Order.findOne({
    user: userId,
    'items.productId': productId,
    orderStatus: 'Delivered',
  });

  const hasPurchased = !!order;

  return res.status(200).json({
    success: true,
    purchased: hasPurchased,
  });
});


