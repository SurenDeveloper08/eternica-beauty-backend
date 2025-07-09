const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require('../middlewares/catchAsyncError')
const APIFeatures = require('../utils/apiFeatures');
const slugify = require('slugify');

exports.getProductsByCategory = catchAsyncError(async (req, res, next) => {
    try {
        const { categorySlug } = req.query;
    
        // 1. Get the category and its SEO
        const category = await Category.findOne({ slug: categorySlug });

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // 2. Get all products under that category
        const data = await Product.find({ category: categorySlug });
     // 3. Return combined response
        res.status(200).json({
            success: true,
            seo: category.seo,
            category: {
                _id: category._id,
                name: category.name,
                slug: category.slug,
                image: category.image,
            },
            data,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

exports.getProductsBySubCategory = async (req, res) => {
    try {

        const { categorySlug, subcategorySlug } = req.query;
        
        if (!categorySlug || !subcategorySlug) {
            return res.status(400).json({ success: false, message: "Both category and subcategory IDs are required" });
        }

        // Fetch products
        const data = await Product.find({ category: categorySlug, subCategory: subcategorySlug });

        // Fetch category and subcategory SEO
        const categoryDoc = await Category.findOne({ slug: categorySlug });
        if (!categoryDoc) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const subCat = categoryDoc.subcategories.find(sub => sub.slug === subcategorySlug);
        if (!subCat) {
            return res.status(404).json({ success: false, message: "Subcategory not found" });
        }

        // Prepare SEO data (fallback to category name if missing)
         const seo = {
            metaTitle: subCat.seo?.metaTitle || subCat.name,
            metaDescription: subCat.seo?.metaDescription || `Browse ${subCat.name} products.`,
            metaKeywords: subCat.seo?.metaKeywords || subCat.name,
            canonicalUrl: subCat.seo?.canonicalUrl || '',
        };
      
        res.status(200).json({
            success: true,
            count: data.length,
            data,
            category:subCat, 
            seo
        });

    } catch (error) {
        console.error("Error fetching subcategory products:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProductsByrelCategory = async (req, res) => {
    try {
        const { slug } = req.query;

        if (!slug) {
            return res.status(400).json({ success: false, message: "Product slug is required" });
        }

        // Find current product by slug
        const currentProduct = await Product.findOne({ slug });

        if (!currentProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Find related products by same category and subCategory, excluding the current product
        const data = await Product.find({
            category: currentProduct.category,
            subCategory: currentProduct.subCategory,
            slug: { $ne: currentProduct.slug },
        });

        res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//Get Products - /api/v1/products
exports.getProducts = catchAsyncError(async (req, res, next) => {

    const data = await Product.find();
    if (!data) {
        return res.status(400).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({
        success: true,
        data
    })
})

exports.searchProducts = catchAsyncError(async (req, res, next) => {

    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: 'Search query missing' });
    }

    try {
        const regex = new RegExp(q, 'i'); // case-insensitive

        const data = await Product.find({
            $or: [
                { productName: regex }
                // { description: regex },
                // { category: regex },
            ]
        }).limit(20);

        res.status(200).json({
            success: true,
            data
        })
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
})
//Create Product - /api/v1/product/new
exports.newProduct = catchAsyncError(async (req, res, next) => {
    let images = [];
    let BASE_URL = process.env.BACKEND_URL;
    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${req.get("host")}`;
    }

    if (req.files.length > 0) {
        req.files.forEach((file) => {
            let url = `${BASE_URL}/uploads/product/${file.originalname}`;
            images.push({ image: url });
        });
    }
    if (typeof req.body.category === 'string') {
        const foundCategory = await Category.findOne({ slug: req.body.category });
        if (!foundCategory) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }
        req.body.category = foundCategory.slug;

        // If you're using subCategory as slug (embedded):
        const foundSub = foundCategory.subcategories.find(
            (sub) => sub.slug === req.body.subCategory
        );
        if (!foundSub) {
            return res.status(400).json({ success: false, message: 'Subcategory not found' });
        }
        req.body.subCategory = foundSub.slug; // or foundSub.name
    }


    // 🔢 Convert number fields from string
    ['stock', 'price', 'oldPrice', 'deliveryDays'].forEach(field => {
        if (req.body[field] !== undefined) {
            req.body[field] = Number(req.body[field]);
        }
    });
    req.body.image = images[0]?.image || '';
    req.body.images = images;

    // Parse JSON fields before creating the product
    if (typeof req.body.specifications === "string") {
        req.body.specifications = JSON.parse(req.body.specifications);
    }
    if (typeof req.body.sizes === "string") {
        req.body.sizes = JSON.parse(req.body.sizes);
    }

    req.body.seo = {
        metaTitle: req.body.metaTitle || '',
        metaDescription: req.body.metaDescription || '',
        metaKeywords: req.body.metaKeywords || '',
        canonicalUrl: req.body.canonicalUrl || ''
    };

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product,
    });
});

//update product
exports.updateProduct = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;

    let BASE_URL = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${req.get("host")}`;
    }

    const product = await Product.findOne({ slug });
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (typeof req.body.category === 'string') {
        const foundCategory = await Category.findOne({ slug: req.body.category });
        if (!foundCategory) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }
        req.body.category = foundCategory.slug;

        // If you're using subCategory as slug (embedded):
        const foundSub = foundCategory.subcategories.find(
            (sub) => sub.slug === req.body.subCategory
        );
        if (!foundSub) {
            return res.status(400).json({ success: false, message: 'Subcategory not found' });
        }
        req.body.subCategory = foundSub.slug; // or foundSub.name
    }


    // 🔢 Convert number fields from string
    ['stock', 'price', 'oldPrice', 'deliveryDays'].forEach(field => {
        if (req.body[field] !== undefined) {
            req.body[field] = Number(req.body[field]);
        }
    });
    // Parse stringified JSON fields
    if (typeof req.body.specifications === "string") {
        req.body.specifications = JSON.parse(req.body.specifications);
    }
    if (typeof req.body.sizes === "string") {
        req.body.sizes = JSON.parse(req.body.sizes);
    }

    // update other fields ...
    for (const key in req.body) {
        if (key !== 'imagesToRemove' && key !== 'productName') {
            product[key] = req.body[key];
        }
    }

    if (req.body.productName) {
        product.productName = req.body.productName;
    }

    // Handle image removal
    const { imagesToRemove } = req.body;
    let updatedImages = product.images || [];

    if (imagesToRemove) {
        updatedImages = updatedImages.filter(img => !imagesToRemove.includes(img.image));
    }

    // Add new images
    if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
            const imageUrl = `${BASE_URL}/uploads/product/${file.originalname}`;
            updatedImages.push({ image: imageUrl });
        });
    }

    if (updatedImages.length > 0) {
        product.image = updatedImages[0].image;
    }

    product.images = updatedImages;

    // SEO fields
    product.seo = {
        metaTitle: req.body.metaTitle || '',
        metaDescription: req.body.metaDescription || '',
        metaKeywords: req.body.metaKeywords || '',
        canonicalUrl: req.body.canonicalUrl || ''
    };

    await product.save();

    res.status(200).json({
        success: true,
        message: "Product updated",
        product
    });
});

//Get Single Product - api/v1/product/:id
exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
    const data = await Product.findOne({ slug: req.params.slug });

    if (!data) {
        return next(new ErrorHandler('Product not found', 400));
    }

    res.status(201).json({
        success: true,
        data
    })
})


// update home products
exports.updateHighlights = catchAsyncError(async (req, res, next) => {
    try {
        const { isFeatured, isPopular, isBestDeal } = req.body;
        const product = await Product.findOneAndUpdate(
            { slug: req.params.slug },
            { isFeatured, isPopular, isBestDeal },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// get by features product home page
exports.getHomePageHighlights = catchAsyncError(async (req, res) => {
    const [featured, popular, bestDeals] = await Promise.all([
        Product.find({ isFeatured: true }).limit(10),
        Product.find({ isPopular: true }).limit(10),
        Product.find({ isBestDeal: true }).limit(10),
    ]);

    res.status(200).json({
        success: true,
        featured,
        popular,
        bestDeals
    });
});

//Delete Product - api/v1/product/:id
exports.deleteProduct = catchAsyncError(async (req, res, next) => {
    const product = await Product.findOne({ slug: req.params.slug });

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product Deleted!"
    });
});


//Create Review - api/v1/review
exports.createReview = catchAsyncError(async (req, res, next) => {
    const { productId, rating, comment } = req.body;

    const review = {
        user: req.user.id,
        rating,
        comment
    }

    const product = await Product.findById(productId);
    //finding user review exists
    const isReviewed = product.reviews.find(review => {
        return review.user.toString() == req.user.id.toString()
    })

    if (isReviewed) {
        //updating the  review
        product.reviews.forEach(review => {
            if (review.user.toString() == req.user.id.toString()) {
                review.comment = comment
                review.rating = rating
            }

        })

    } else {
        //creating the review
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }
    //find the average of the product reviews
    product.ratings = product.reviews.reduce((acc, review) => {
        return review.rating + acc;
    }, 0) / product.reviews.length;
    product.ratings = isNaN(product.ratings) ? 0 : product.ratings;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    })


})

//Get Reviews - api/v1/reviews?id={productId}
exports.getReviews = catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.id).populate('reviews.user', 'name email');

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})

//Delete Review - api/v1/review
exports.deleteReview = catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);

    //filtering the reviews which does match the deleting review id
    const reviews = product.reviews.filter(review => {
        return review._id.toString() !== req.query.id.toString()
    });
    //number of reviews 
    const numOfReviews = reviews.length;

    //finding the average with the filtered reviews
    let ratings = reviews.reduce((acc, review) => {
        return review.rating + acc;
    }, 0) / reviews.length;
    ratings = isNaN(ratings) ? 0 : ratings;

    //save the product document
    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        numOfReviews,
        ratings
    })
    res.status(200).json({
        success: true
    })


});

// get admin products  - api/v1/admin/products
exports.getAdminProducts = catchAsyncError(async (req, res, next) => {

    const products = await Product.find();
    res.status(200).send({
        success: true,
        products
    })
});