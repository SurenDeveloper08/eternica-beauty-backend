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
        const { slug, rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        const review = new Review({
            slug,
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
        const reviews = await Review.find({ slug: req.params.slug }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
})

exports.getRating = catchAsyncError(async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const reviews = await Review.find({ slug });

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
    const slug = req.params.slug;

    // Directly query orders for the given slug in delivered orders
    const order = await Order.findOne({
        user: userId,
        'items.slug': slug,
        orderStatus: 'Delivered',
    });

    const hasPurchased = !!order;
  
    return res.status(200).json({
        success: true,
        purchased: hasPurchased,
    });
});


exports.newAdminReview = catchAsyncError(async (req, res, next) => {
    try {
        const { productId, rating, name, comment, isActive, sortOrder } = req.body;
       
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const review = new Review({
            productId,
            name,
            userId: req.user.id,
            rating,
            comment,
            isActive,
            sortOrder
        });

        await review.save();

        res.status(201).json({ success: true, message: 'Review added successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error submitting review' });
    }
});

exports.getAllReviews = catchAsyncError(async (req, res, next) => {
    try {
        const reviews = await Review.find().populate('productId', 'productName');

        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
})

exports.updateReviewStatus = catchAsyncError(async (req, res, next) => {
    const review = await Review.findByIdAndUpdate(
        req.params.id,
        { isActive: req.body.isActive },
        { new: true }
    );

    if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, data: review });
});

exports.updateAdminReview = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { productId, name, rating, comment, isActive, sortOrder } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            id,
            {
                productId,
                name,
                rating,
                comment,
                isActive,
                sortOrder
            },
            { new: true, runValidators: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({ success: true, message: 'Review updated successfully', data: updatedReview });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating review' });
    }
});
exports.getReviewById = catchAsyncError(async (req, res, next) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findById(reviewId).populate('productId', 'productName');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
    });
  }
});

exports.deleteAdminReview = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        const deletedReview = await Review.findByIdAndDelete(id);

        if (!deletedReview) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting review' });
    }
});
