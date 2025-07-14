const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require('../middlewares/catchAsyncError')
const APIFeatures = require('../utils/apiFeatures');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');


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
    console.log('productImage:', req.files.productImage?.map(f => f.filename));
    console.log('galleryImages:', req.files.files?.map(f => f.filename));
    console.log('variantImages:', req.files.variantImages?.map(f => f.filename));

    const BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

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
    const descriptions =req.body?.descriptions;
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
        const variantImages = allImages.slice(imgIndex, imgIndex + variantImagesCount).map(img => img.image);
        imgIndex += variantImagesCount;

        const updatedSizes = (variant.sizes || []).map((size) => {
            const sizeImagesCount = size.images?.length || 0;
            const sizeImages = allImages.slice(imgIndex, imgIndex + sizeImagesCount).map(img => img.image);
            imgIndex += sizeImagesCount;

            return {
                name: size.name || '',
                price: Number(size.price || 0),
                stock: Number(size.stock || 0),
                images: sizeImages
            };
        });

        const hasColor = variant.color?.trim() !== '';
        const hasSizes = updatedSizes.length > 0;

        return {
            color: hasColor ? variant.color : undefined,
            colorCode: hasColor ? variant.colorCode : undefined,
            images: variantImages,
            sizes: updatedSizes,
            price: hasSizes ? Math.min(...updatedSizes.map(s => s.price || 0)) : Number(variant.price || 0),
            stock: hasSizes ? updatedSizes.reduce((sum, s) => sum + (s.stock || 0), 0) : Number(variant.stock || 0)
        };
    });

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
        slug: '', // generated in schema
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
// update product
// exports.updateProduct = catchAsyncError(async (req, res, next) => {
//   const { slug } = req.params;

//     let BASE_URL = process.env.BACKEND_URL;

//     if (process.env.NODE_ENV === "production") {
//         BASE_URL = `${req.protocol}://${req.get("host")}`;
//     }

//     const product = await Product.findOne({ slug });
//     if (!product) {
//         return res.status(404).json({ success: false, message: "Product not found" });
//     }
//     if (typeof req.body.category === 'string') {
//         const foundCategory = await Category.findOne({ slug: req.body.category });
//         if (!foundCategory) {
//             return res.status(400).json({ success: false, message: 'Category not found' });
//         }
//         req.body.category = foundCategory.slug;

//         // If you're using subCategory as slug (embedded):
//         const foundSub = foundCategory.subcategories.find(
//             (sub) => sub.slug === req.body.subCategory
//         );
//         if (!foundSub) {
//             return res.status(400).json({ success: false, message: 'Subcategory not found' });
//         }
//         req.body.subCategory = foundSub.slug; // or foundSub.name
//     }


//     // 🔢 Convert number fields from string
//     ['stock', 'price', 'oldPrice', 'deliveryDays'].forEach(field => {
//         if (req.body[field] !== undefined) {
//             req.body[field] = Number(req.body[field]);
//         }
//     });
//     // Parse stringified JSON fields
//     if (typeof req.body.specifications === "string") {
//         req.body.specifications = JSON.parse(req.body.specifications);
//     }
//     if (typeof req.body.sizes === "string") {
//         req.body.sizes = JSON.parse(req.body.sizes);
//     }

//     // update other fields ...
//     for (const key in req.body) {
//         if (key !== 'imagesToRemove' && key !== 'productName') {
//             product[key] = req.body[key];
//         }
//     }

//     if (req.body.productName) {
//         product.productName = req.body.productName;
//     }

//     // Handle image removal
//     const { imagesToRemove } = req.body;
//     let updatedImages = product.images || [];

//     if (imagesToRemove) {
//         updatedImages = updatedImages.filter(img => !imagesToRemove.includes(img.image));
//     }

//     // Add new images
//     if (req.files && req.files.length > 0) {
//         req.files.forEach((file) => {
//             const imageUrl = `${BASE_URL}/uploads/product/${file.originalname}`;
//             updatedImages.push({ image: imageUrl });
//         });
//     }

//     if (updatedImages.length > 0) {
//         product.image = updatedImages[0].image;
//     }

//     product.images = updatedImages;

//     // SEO fields
//     product.seo = {
//         metaTitle: req.body.metaTitle || '',
//         metaDescription: req.body.metaDescription || '',
//         metaKeywords: req.body.metaKeywords || '',
//         canonicalUrl: req.body.canonicalUrl || ''
//     };

//     await product.save();

//     res.status(200).json({
//         success: true,
//         message: "Product updated",
//         product
//     });
// });

exports.updateProducts = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    const product = await Product.findOne({ slug });

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }


    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const allUploadedImages = (req.files || []).map(file => ({
        image: `${BASE_URL}/uploads/product/${file.filename}`,
        name: file.filename
    }));


    // Parse all fields
    const variants = JSON.parse(req.body.variants || '[]');
    const specifications = JSON.parse(req.body.specifications || '[]');
    const descriptions = req.body.descriptions || '[]';
    const highlights = req.body.highlights || '[]';

    // Prepare variant structure
    let imgIndex = 0;

    const updatedVariants = variants.map((variant) => {
        const variantImgCount = variant.images?.length || 0;
        const variantImgs = allUploadedImages.slice(imgIndex, imgIndex + variantImgCount).map(img => img.image);
        imgIndex += variantImgCount;

        // DELETE variant removed images
        if (variant.removedImages?.length) {
            variant.removedImages.forEach(img => {
                const fileName = img.split('/').pop();
                const filePath = `uploads/product/${fileName}`;
                fs.existsSync(filePath) && fs.unlinkSync(filePath);
            });
        }

        const sizes = (variant.sizes || []).map(size => {
            const sizeImgCount = size.images?.length || 0;
            const sizeImgs = allUploadedImages.slice(imgIndex, imgIndex + sizeImgCount).map(img => img.image);
            imgIndex += sizeImgCount;

            // DELETE removed size images
            if (size.removedImages?.length) {
                size.removedImages.forEach(img => {
                    const fileName = img.split('/').pop();
                    const filePath = `uploads/product/${fileName}`;
                    fs.existsSync(filePath) && fs.unlinkSync(filePath);
                });
            }

            return {
                ...size,
                price: Number(size.price || 0),
                stock: Number(size.stock || 0),
                images: [...(size.existingImages || []), ...sizeImgs]
            };
        });

        return {
            color: variant.color,
            colorCode: variant.colorCode,
            price: Number(variant.price || 0),
            stock: Number(variant.stock || 0),
            images: [...(variant.existingImages || []), ...variantImgs],
            sizes
        };
    });
    if (req.files?.productImage?.length > 0) {
        const file = req.files.productImage[0];
        product.image = `${BASE_URL}/uploads/product/${file.filename}`;
    }
    // Update base fields
    product.productName = req.body.productName;
    product.brand = req.body.brand;
    product.category = req.body.category;
    product.subCategory = req.body.subCategory;
    product.overview = req.body.overview;
    product.stock = Number(req.body.stock || 0);
    product.deliveryDays = Number(req.body.deliveryDays || 0);
    product.price = Number(req.body.price || 0);
    product.oldPrice = Number(req.body.oldPrice || 0);
    product.descriptions = descriptions;
    product.highlights = highlights;
    product.specifications = specifications;
    product.variants = updatedVariants;
    product.seo = {
        metaTitle: req.body.metaTitle || '',
        metaDescription: req.body.metaDescription || '',
        metaKeywords: req.body.metaKeywords || '',
        canonicalUrl: req.body.canonicalUrl || ''
    };

    // Save
    await product.save();

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product
    });
});

exports.updateProduct = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    const product = await Product.findOne({ slug });

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const uploadedMainImage = req.files?.productImage?.[0];
    const uploadedGalleryImages = req.files?.files || [];
    const uploadedVariantImages = req.files?.variantImages || [];

    const allUploadedImages = [...uploadedGalleryImages, ...uploadedVariantImages].map(file => ({
        image: `${BASE_URL}/uploads/product/${file.filename}`,
        name: file.filename
    }));

    // === Handle removed gallery images ===
    const removedGalleryImages = JSON.parse(req.body.removedGalleryImages || '[]');
    removedGalleryImages.forEach(img => {
        const fileName = img.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', 'product', fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    // === Update gallery images ===
    const existingGalleryImages = JSON.parse(req.body.existingGalleryImages || '[]');
    const updatedGalleryImages = [
        ...existingGalleryImages.map(img => ({ image: img })),
        ...uploadedGalleryImages.map(file => ({ image: `${BASE_URL}/uploads/product/${file.filename}` }))
    ];

    // === Update main image ===
    if (uploadedMainImage) {
        product.image = `${BASE_URL}/uploads/product/${uploadedMainImage.filename}`;
    }

    // === Parse fields ===
    const variants = JSON.parse(req.body.variants || '[]');
    const specifications = JSON.parse(req.body.specifications || '[]');
    const descriptions = req.body.descriptions;
    const highlights = req.body.highlights;

    // === Prepare variants ===
    const galleryCount = uploadedGalleryImages.length;
    const variantAndSizeImages = allUploadedImages.slice(galleryCount);

    let imgIndex = 0;
    const updatedVariants = variants.map((variant) => {
        const variantImgCount = variant.images?.length || 0;
        const variantImgs = variantAndSizeImages.slice(imgIndex, imgIndex + variantImgCount).map(img => img.image);
        imgIndex += variantImgCount;

        (variant.removedImages || []).forEach(img => {
            const fileName = img.split('/').pop();
            const filePath = path.join(__dirname, '..', 'uploads', 'product', fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        const sizes = (variant.sizes || []).map(size => {
            const sizeImgCount = size.images?.length || 0;
            const sizeImgs = variantAndSizeImages.slice(imgIndex, imgIndex + sizeImgCount).map(img => img.image);
            imgIndex += sizeImgCount;

            (size.removedImages || []).forEach(img => {
                const fileName = img.split('/').pop();
                const filePath = path.join(__dirname, '..', 'uploads', 'product', fileName);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });

            return {
                ...size,
                price: Number(size.price || 0),
                stock: Number(size.stock || 0),
                images: [...(size.existingImages || []), ...sizeImgs]
            };
        });

        return {
            color: variant.color,
            colorCode: variant.colorCode,
            price: Number(variant.price || 0),
            stock: Number(variant.stock || 0),
            images: [...(variant.existingImages || []), ...variantImgs],
            sizes
        };
    });

    // === Update base product fields ===
    product.productName = req.body.productName;
    product.brand = req.body.brand;
    product.category = req.body.category;
    product.subCategory = req.body.subCategory;
    product.overview = req.body.overview;
    product.stock = Number(req.body.stock || 0);
    product.deliveryDays = Number(req.body.deliveryDays || 0);
    product.price = Number(req.body.price || 0);
    product.oldPrice = Number(req.body.oldPrice || 0);
    product.descriptions = descriptions;
    product.highlights = highlights;
    product.specifications = specifications;
    product.variants = updatedVariants;
    product.images = updatedGalleryImages;
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