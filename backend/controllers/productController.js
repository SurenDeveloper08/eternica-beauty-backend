const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require('../middlewares/catchAsyncError')
const APIFeatures = require('../utils/apiFeatures');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');
const resizeImages = require('../utils/resizeImages'); // adjust path as needed
const { convertProductPrices } = require('../utils/convertProductPrices');
const mongoose = require("mongoose");

function deleteFileIfExists(filePath) {
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        console.error("Error deleting file:", err);
    }
}

function mergeVariants(existingVariants = [], incomingVariants = []) {
    return incomingVariants.map(incoming => {
        const existingVariant = existingVariants.find(v => v._id?.toString() === incoming._id?.toString());
        const variantId = existingVariant?._id || new mongoose.Types.ObjectId();

        const updatedSizes = (incoming.sizes || []).map(size => {
            const existingSize = existingVariant?.sizes?.find(s => s._id?.toString() === size._id?.toString());
            const sizeId = existingSize?._id || new mongoose.Types.ObjectId();

            return {
                _id: sizeId,
                name: size.name,
                price: Number(size.price || 0),
                stock: Number(size.stock || 0),
                images: size.images || [],
                longImages: size.longImages || [],
            };
        });

        return {
            _id: variantId,
            color: incoming.color,
            colorCode: incoming.colorCode,
            price: Number(incoming.price || 0),
            stock: Number(incoming.stock || 0),
            images: incoming.images || [],
            longImages: incoming.longImages || [],
            sizes: updatedSizes,
        };
    });
}

exports.getProductsByCategory = catchAsyncError(async (req, res, next) => {
    try {
        const currency = req.query.currency || 'AED';
        const { categorySlug } = req.query;

        // 1. Get the category and its SEO
        const category = await Category.findOne({ slug: categorySlug });

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // 2. Get all products under that category
        const data = await Product.find({ category: categorySlug, isActive: true });

        const converted = await Promise.all(
            data.map(p => convertProductPrices(p, currency))
        );

        // 3. Return combined response
        res.status(200).json({
            success: true,
            seo: category.seo,
            currency,
            category: {
                _id: category._id,
                name: category.name,
                slug: category.slug,
                image: category.image,
            },
            data: converted,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

exports.getProductsBySubCategory = async (req, res) => {
    try {
        const currency = req.query.currency || 'AED';
        const { categorySlug, subcategorySlug } = req.query;

        if (!categorySlug || !subcategorySlug) {
            return res.status(400).json({ success: false, message: "Both category and subcategory IDs are required" });
        }

        // Fetch products
        const data = await Product.find({ category: categorySlug, subCategory: subcategorySlug, isActive: true });

        const converted = await Promise.all(
            data.map(p => convertProductPrices(p, currency))
        );
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
            count: converted.length,
            currency,
            data: converted,
            category: subCat,
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
        const currency = req.query.currency || 'AED';
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

        const converted = await Promise.all(
            data.map(product => convertProductPrices(product, currency))
        );
        res.status(200).json({
            success: true,
            count: data.length,
            currency,
            data: converted
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProductsByCFilter = catchAsyncError(async (req, res, next) => {
    try {
        const currency = req.query.currency || 'AED';
        const { category } = req.body;
        if (!category || category.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Category is required",
            });
        }
        const products = await Product.find({ category: category, isActive: true });
        const converted = await Promise.all(
            products.map(p => convertProductPrices(p, currency))
        );
        return res.status(200).json({
            success: true,
            currency,
            count: converted.length,
            data: converted,
        });

    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
})

exports.getProductsBySCFilter = catchAsyncError(async (req, res, next) => {
    try {
        const currency = req.query.currency || 'AED';
        //Extract subcategories from request body
        const { subcategories = [] } = req.body;

        //Validate input
        if (!Array.isArray(subcategories) || subcategories.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one subcategory is required",
            });
        }

        //Fetch products by subcategories (matching any of the provided slugs)
        const products = await Product.find({
            subCategory: { $in: subcategories },
            isActive: true,
        });
        const converted = await Promise.all(
            products.map(p => convertProductPrices(p, currency))
        );
        //Return response
        return res.status(200).json({
            success: true,
            currency,
            count: converted.length,
            data: converted,
        });
    } catch (err) {
        console.error("Filter by subcategory error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products by subcategories",
            error: err.message,
        });
    }
});

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
    const currency = req.query.currency || 'AED';

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
        const converted = await Promise.all(
            data.map(p => convertProductPrices(p, currency))
        );
        res.status(200).json({
            success: true,
            currency,
            data: converted
        })
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
})
//Create Product - /api/v1/product/new
exports.newProduct = catchAsyncError(async (req, res, next) => {
    const BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const allFiles = [
        ...(req.files?.productImage || []),
        ...(req.files?.files || []),
        ...(req.files?.variantImages || []),
    ];
    const filePaths = allFiles.map(file => file.path); // absolute paths


    const resizedFilenames = await resizeImages(filePaths, true);
    allFiles.forEach((file, i) => {
        file.filename = resizedFilenames[i].resizedFilename;
        file.longFilename = resizedFilenames[i].longFilename;
    });

    let allImages = [];
    let mainImage = '';

    // 1. Handle main product image

    if (req.files?.productImage?.length > 0) {
        const file = req.files.productImage[0];
        mainImage = `${BASE_URL}/uploads/product/${file.filename}`;
    }

    // 2. Gather all other images (gallery + variant images)
    const galleryFiles = req.files?.files || [];
    const variantFiles = req.files?.variantImages || [];

    [...galleryFiles, ...variantFiles].forEach(file => {
        allImages.push({
            image: `${BASE_URL}/uploads/product/${file.filename}`,
            longImage: `${BASE_URL}/uploads/product/${file.longFilename}`,
        });
    });

    // 3. Validate category & subcategory
    if (typeof req.body.category === 'string') {
        const foundCategory = await Category.findOne({ slug: req.body.category });
        if (!foundCategory) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }
        req.body.category = foundCategory.slug;

        const foundSub = foundCategory.subcategories.find(
            (sub) => sub.slug === req.body.subCategory
        );
        if (!foundSub) {
            return res.status(400).json({ success: false, message: 'Subcategory not found' });
        }
        req.body.subCategory = foundSub.slug;
    }

    // 4. Convert numbers
    ['stock', 'price', 'oldPrice', 'deliveryDays'].forEach(field => {
        if (req.body[field] !== undefined) {
            req.body[field] = Number(req.body[field]);
        }
    });

    // 5. Parse JSON fields
    const descriptions = req.body?.descriptions;
    const highlights = req.body.highlights;
    const specifications = JSON.parse(req.body.specifications || '[]');
    const variants = JSON.parse(req.body.variants || '[]');

    // 6. Distribute images
    let imgIndex = 0;
    const totalExpectedVariantImages = variants.reduce((acc, variant) => {
        const variantCount = variant.images?.length || 0;
        const sizeCount = (variant.sizes || []).reduce((sAcc, s) => sAcc + (s.images?.length || 0), 0);
        return acc + variantCount + sizeCount;
    }, 0);

    const galleryImagesCount = allImages.length - totalExpectedVariantImages;
    const galleryImages = allImages.slice(imgIndex, imgIndex + galleryImagesCount);
    imgIndex += galleryImagesCount;

    const updatedVariants = variants.map((variant) => {
        const variantImagesCount = variant.images?.length || 0;
        const variantImages = allImages.slice(imgIndex, imgIndex + variantImagesCount);
        imgIndex += variantImagesCount;

        const updatedSizes = (variant.sizes || []).map((size) => {
            const sizeImagesCount = size.images?.length || 0;
            const sizeImageObjects = allImages.slice(imgIndex, imgIndex + sizeImagesCount);
            imgIndex += sizeImagesCount;

            return {
                name: size.name || '',
                price: Number(size.price || 0),
                stock: Number(size.stock || 0),
                images: sizeImageObjects.map(img => img.image),
                longImages: sizeImageObjects.map(img => img.longImage)
            };
        });

        const hasColor = variant.color?.trim() !== '';
        const hasSizes = updatedSizes.length > 0;

        return {
            color: hasColor ? variant.color : undefined,
            colorCode: hasColor ? variant.colorCode : undefined,
            images: variantImages.map(img => img.image),
            longImages: variantImages.map(img => img.longImage),
            sizes: updatedSizes,
            price: hasSizes ? Math.min(...updatedSizes.map(s => s.price || 0)) : Number(variant.price || 0),
            stock: hasSizes ? updatedSizes.reduce((sum, s) => sum + (s.stock || 0), 0) : Number(variant.stock || 0)
        };
    });
    const sellGlobally = req.body.sellGlobally === 'false' ? false : true;
    const restrictedCountries = JSON.parse(req.body.restrictedCountries || '[]');
    const allowedCountries = JSON.parse(req.body.allowedCountries || '[]');

    // 7. SEO
    const seo = {
        metaTitle: req.body.metaTitle || '',
        metaDescription: req.body.metaDescription || '',
        metaKeywords: req.body.metaKeywords || '',
        canonicalUrl: req.body.canonicalUrl || ''
    };

    // 8. Create Product
    const productData = {
        productName: req.body.productName,
        slug: '',
        brand: req.body.brand,
        category: req.body.category,
        subCategory: req.body.subCategory,
        overview: req.body.overview,
        stock: req.body.stock,
        deliveryDays: req.body.deliveryDays,
        price: req.body.price,
        oldPrice: req.body.oldPrice,
        descriptions,
        highlights,
        specifications,
        variants: updatedVariants,
        image: mainImage || galleryImages[0]?.image || '',
        images: galleryImages,
        //longImages: galleryImages.map(img => img.longImage),
        sellGlobally,
        restrictedCountries,
        allowedCountries,
        seo
    };


    const product = await Product.create(productData);

    res.status(201).json({
        success: true,
        product,
    });
});

exports.deleteProduct = async (req, res) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({ slug });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Optional: Delete images from file system if using local storage
        if (product.image) {
            const imagePath = path.join(__dirname, '../../uploads/products/', product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Optional: Delete gallery images
        for (const img of product.images || []) {
            const imgPath = path.join(__dirname, '../../uploads/products/gallery/', img.image || img);
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        }

        await product.deleteOne();

        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ message: 'Server error while deleting product' });
    }
};

exports.updateProduct = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    const product = await Product.findOne({ slug });
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const BASE_URL = process.env.NODE_ENV === 'production'
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get('host')}`;

    // -----------------------------
    // 1. Delete removed images from disk (existing images only)
    // -----------------------------
    const removedGalleryImages = JSON.parse(req.body.removedGalleryImages || '[]');
    removedGalleryImages.forEach(imgUrl => {
        const fileName = imgUrl.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', 'product', fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        const longFilePath = path.join(__dirname, '..', 'uploads', 'product', `long-${fileName}`);
        if (fs.existsSync(longFilePath)) fs.unlinkSync(longFilePath);
    });

    const variantsFromClient = JSON.parse(req.body.variants || '[]');
    variantsFromClient.forEach(variant => {
        (variant.removedImages || []).forEach(imgUrl => {
            const fileName = imgUrl.split('/').pop();
            const filePath = path.join(__dirname, '..', 'uploads', 'product', fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            const longFilePath = path.join(__dirname, '..', 'uploads', 'product', `long-${fileName}`);
            if (fs.existsSync(longFilePath)) fs.unlinkSync(longFilePath);
        });
        (variant.sizes || []).forEach(size => {
            (size.removedImages || []).forEach(imgUrl => {
                const fileName = imgUrl.split('/').pop();
                const filePath = path.join(__dirname, '..', 'uploads', 'product', fileName);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                const longFilePath = path.join(__dirname, '..', 'uploads', 'product', `long-${fileName}`);
                if (fs.existsSync(longFilePath)) fs.unlinkSync(longFilePath);
            });
        });
    });

    // -----------------------------
    // 2. Resize only newly uploaded images
    // -----------------------------
    // Collect newly uploaded files (main + gallery + variant images)
    const uploadedMainImage = req.files?.productImage?.[0];
    const uploadedGalleryImages = req.files?.files || [];
    const uploadedVariantImages = req.files?.variantImages || [];

    const allNewFiles = [
        ...(uploadedMainImage ? [uploadedMainImage] : []),
        ...uploadedGalleryImages,
        ...uploadedVariantImages
    ];

    const newFilePaths = allNewFiles.map(f => f.path);

    // Resize only new files
    const resizedFilenames = await resizeImages(newFilePaths, true);

    // Assign resized and long filenames to the newly uploaded files
    allNewFiles.forEach((file, i) => {
        file.filename = resizedFilenames[i].resizedFilename;
        file.longFilename = resizedFilenames[i].longFilename;
    });

    // -----------------------------
    // 3. Build updated gallery images (keep existing + add new resized)
    // -----------------------------
    const existingGalleryImages = JSON.parse(req.body.existingGalleryImages || '[]'); // array of URLs

    const updatedGalleryImages = [
        ...existingGalleryImages.map(imgUrl => ({ image: imgUrl })), // keep existing
        ...uploadedGalleryImages.map(file => ({
            image: `${BASE_URL}/uploads/product/${file.filename}`,
            longImage: `${BASE_URL}/uploads/product/long-${file.filename}`
        }))
    ];

    // -----------------------------
    // 4. Build updated variants with existing + new images
    // -----------------------------
    let imgIndex = 0;
    // Slice newly resized variant images + size images from allNewFiles (after gallery)
    const variantAndSizeImages = [...uploadedVariantImages]; // new variant images

    const updatedVariants = variantsFromClient.map(variant => {
        const variantImgCount = variant.images?.length || 0;
        const variantImgs = variantAndSizeImages.slice(imgIndex, imgIndex + variantImgCount).map(file => ({
            image: `${BASE_URL}/uploads/product/${file.filename}`,
            longImage: `${BASE_URL}/uploads/product/long-${file.filename}`
        }));
        imgIndex += variantImgCount;

        const updatedSizes = (variant.sizes || []).map(size => {
            const sizeImgCount = size.images?.length || 0;
            const sizeImgs = variantAndSizeImages.slice(imgIndex, imgIndex + sizeImgCount).map(file => ({
                image: `${BASE_URL}/uploads/product/${file.filename}`,
                longImage: `${BASE_URL}/uploads/product/long-${file.filename}`
            }));
            imgIndex += sizeImgCount;

            return {
                _id: size._id,
                name: size.name || '',
                price: Number(size.price || 0),
                stock: Number(size.stock || 0),
                // Merge existing images and new images
                images: [...(size.existingImages || []), ...sizeImgs.map(i => i.image)],
                longImages: [...(size.existingLongImages || []), ...sizeImgs.map(i => i.longImage)]
            };
        });

        return {
            _id: variant._id,
            color: variant.color?.trim() !== '' ? variant.color : undefined,
            colorCode: variant.colorCode,
            images: [...(variant.existingImages || []), ...variantImgs.map(i => i.image)],
            longImages: [...(variant.existingLongImages || []), ...variantImgs.map(i => i.longImage)],
            sizes: updatedSizes,
            price: updatedSizes.length > 0
                ? Math.min(...updatedSizes.map(s => s.price || 0))
                : Number(variant.price || 0),
            stock: updatedSizes.length > 0
                ? updatedSizes.reduce((sum, s) => sum + (s.stock || 0), 0)
                : Number(variant.stock || 0)
        };
    });

    // -----------------------------
    // 5. Update main image if newly uploaded
    // -----------------------------
    if (uploadedMainImage) {
        product.image = `${BASE_URL}/uploads/product/${uploadedMainImage.filename}`;
    }

    // -----------------------------
    // 6. Update other product fields
    // -----------------------------
    product.productName = req.body.productName;
    product.brand = req.body.brand;
    product.category = req.body.category;
    product.subCategory = req.body.subCategory;
    product.overview = req.body.overview;
    product.stock = Number(req.body.stock || 0);
    product.deliveryDays = Number(req.body.deliveryDays || 0);
    product.price = Number(req.body.price || 0);
    product.oldPrice = Number(req.body.oldPrice || 0);
    product.descriptions = req.body.descriptions;
    product.highlights = req.body.highlights;
    product.specifications = JSON.parse(req.body.specifications || '[]');
    product.variants = updatedVariants;
    product.images = updatedGalleryImages;
    // product.longImages = updatedGalleryImages.map(img => img.longImage); // Uncomment if schema supports
    product.sellGlobally = req.body.sellGlobally === 'false' ? false : true;
    product.restrictedCountries = JSON.parse(req.body.restrictedCountries || '[]');
    product.allowedCountries = JSON.parse(req.body.allowedCountries || '[]');
    product.seo = {
        metaTitle: req.body.metaTitle || '',
        metaDescription: req.body.metaDescription || '',
        metaKeywords: req.body.metaKeywords || '',
        canonicalUrl: req.body.canonicalUrl || ''
    };

    await product.save();

    res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product
    });
});

//Get Single Product - api/v1/product/:id
exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
    const currency = req.query.currency || 'AED';
    const data = await Product.findOne({ slug: req.params.slug });

    if (!data) {
        return next(new ErrorHandler('Product not found', 400));
    }

    const converted = await convertProductPrices(data, currency);

    res.status(201).json({
        success: true,
        currency,
        data: converted
    })
})

//Get Single Product - api/v1/product/:id
exports.getAdminSingleProduct = catchAsyncError(async (req, res, next) => {
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
exports.deleteProductOne = catchAsyncError(async (req, res, next) => {
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