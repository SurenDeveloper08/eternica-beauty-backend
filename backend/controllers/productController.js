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
const { log } = require('console');

//admin

exports.createProduct = catchAsyncError(async (req, res, next) => {

    const BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const allFiles = [
        ...(req.files?.image || []),
        ...(req.files?.images || []),
    ];

    const filePaths = allFiles.map(file => file.path);
    const resizedFilenames = await resizeImages(filePaths, true);

    allFiles.forEach((file, i) => {
        file.filename = resizedFilenames[i].resizedFilename;
        file.longFilename = resizedFilenames[i].longFilename;
    });

    let allImages = [];
    let mainImage = '';

    if (req.files?.image?.length > 0) {
        const file = req.files.image[0];
        mainImage = `${BASE_URL}/uploads/product/${file.filename}`;
    }

    const galleryFiles = req.files?.images || [];
    galleryFiles.forEach(file => {
        allImages.push({
            image: `${BASE_URL}/uploads/product/${file.filename}`,
            longImage: `${BASE_URL}/uploads/product/${file.longFilename}`,
        });
    });

    // 🔸 Category & (Optional) Subcategory
    const categorySlug = JSON.parse(req.body.category || "{}");
    const subCategorySlug = req.body.subCategory ? JSON.parse(req.body.subCategory) : null;

    const validCategory = await Category.findOne({ slug: categorySlug });
    if (!validCategory) {
        return res.status(400).json({ success: false, message: 'Category not found' });
    }

    let validSubCategory = null;

    if (subCategorySlug) {
        const subExists = validCategory.subcategories.some(
            sub => sub.slug === subCategorySlug
        );

        if (!subExists) {
            return res.status(400).json({
                success: false,
                message: `Subcategory "${subCategorySlug}" not found in selected category "${validCategory.name}".`
            });
        }
        validSubCategory = subCategorySlug;
    }
    //  Set back in body
    req.body.category = validCategory.slug;
    req.body.subCategory = validSubCategory?.slug || null;

    //  Number fields
    ['stock', 'price', 'oldPrice', 'deliveryDays'].forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== "") {
            req.body[field] = Number(req.body[field]);
        } else {
            req.body[field] = undefined;
        }
    });

    const safeParse = (data) => {
        try {
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
            return null;
        }
    };

    const productName = safeParse(req.body?.productName);
    const slug = slugify(productName ? productName.trim() : "product-name", { lower: true, strict: true });

    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
        return res.status(400).json({
            success: false,
            message: `Product with the name "${productName}" already exists.`,
        });
    }

    const description = safeParse(req.body?.description);
    const features = safeParse(req.body.features);
    const whyChoose = safeParse(req.body.whyChoose);
    const instructions = safeParse(req.body.instructions);
    const specifications = safeParse(req.body.specifications || '[]');

    const seo = {
        metaTitle: req.body.seo?.metaTitle || '',
        metaDescription: req.body.seo?.metaDescription || '',
        metaKeywords: req.body.seo?.metaKeywords || '',
        canonicalUrl: req.body.seo?.canonicalUrl || ''
    };

    const productData = {
        productName,
        slug,
        brand: req.body.brand,
        category: req.body.category,
        subCategory: req.body.subCategory, // could be null
        overview: req.body.overview,
        stock: req.body.stock,
        deliveryDays: req.body.deliveryDays,
        price: req.body.price,
        oldPrice: req.body.oldPrice,
        description,
        features,
        whyChoose,
        instructions,
        specifications,
        image: mainImage || allImages[0]?.image || '',
        images: allImages,
        sellGlobally: req.body.sellGlobally === 'false' ? false : true,
        restrictedCountries: safeParse(req.body.restrictedCountries || '[]'),
        allowedCountries: safeParse(req.body.allowedCountries || '[]'),
        seo
    };

    const product = await Product.create(productData);

    res.status(201).json({
        success: true,
        product,
    });
});

// Custom Validators (example)
async function validateCategoryAndSubCategory(categorySlug, subCategorySlug) {
    const foundCategory = await Category.findOne({ slug: categorySlug });
    if (!foundCategory) return { validCategory: null, validSubCategory: null };

    const foundSub = foundCategory.subcategories.find(
        (sub) => sub.slug === subCategorySlug
    );
    return { validCategory: foundCategory, validSubCategory: foundSub };
}

//admin
exports.getAdminProducts = catchAsyncError(async (req, res, next) => {
    try {
        const data = await Product.find();
        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No products found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error(error);
        next(error); // Pass the error to global error handler
    }
});

//admin
exports.getAdminProduct = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;
    const data = await Product.findOne({ slug: productId });

    if (!data) {
        return next(new ErrorHandler('Product not found', 400));
    }

    res.status(201).json({
        success: true,
        data
    })
})

//admin
exports.updateProduct = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;

    // Find product by slug
    const product = await Product.findOne({ slug: productId });
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    const BASE_URL =
        process.env.NODE_ENV === "production"
            ? process.env.BACKEND_URL
            : `${req.protocol}://${req.get("host")}`;

    // Handle main and gallery images
    const newMainImage = req.files?.image?.[0];
    const newGalleryImages = req.files?.images || [];

    const allFiles = [...(newMainImage ? [newMainImage] : []), ...newGalleryImages];
    const resizedData = await resizeImages(allFiles.map(f => f.path), true);
    allFiles.forEach((file, i) => {
        file.filename = resizedData[i].resizedFilename;
        file.longFilename = resizedData[i].longFilename;
    });

    if (newMainImage) {
        // Remove old main image
        if (product.image) {
            const oldMainPath = path.join("uploads/product", path.basename(product.image));
            if (fs.existsSync(oldMainPath)) fs.unlinkSync(oldMainPath);
        }
        product.image = `${BASE_URL}/uploads/product/${newMainImage.filename}`;
    }

    // Remove selected gallery images
    const removedImages = JSON.parse(req.body.removedImages || "[]");
    for (const imgUrl of removedImages) {
        const filePath = path.join("uploads/product", path.basename(imgUrl));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Update gallery images
    const keptGallery = product.images.filter(img => !removedImages.includes(img.image));
    const addedGallery = newGalleryImages.map(file => ({
        image: `${BASE_URL}/uploads/product/${file.filename}`,
        longImage: `${BASE_URL}/uploads/product/${file.longFilename}`,
    }));
    product.images = [...keptGallery, ...addedGallery];

    // Handle numeric fields safely
    const numericFields = ["price", "oldPrice", "stock", "deliveryDays"];
    numericFields.forEach(field => {
        if (req.body[field] !== undefined) {
            let value = req.body[field];
            if (value === "" || value === "null") {
                product[field] = null;
            } else {
                const num = Number(value);
                product[field] = isNaN(num) ? null : num;
            }
        }
    });

    // Update slug if product name changed
    if (req.body.productName && req.body.productName !== product.productName) {
        let baseSlug = slugify(req.body.productName, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        while (await Product.exists({ slug, _id: { $ne: product._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        product.slug = slug;
    }

    // Update other fields
    const jsonFields = [
        "productName", "category", "subCategory", "description",
        "overview", "features", "whyChoose", "instructions",
        "specifications", "seo"
    ];
    jsonFields.forEach(field => {
        if (req.body[field] !== undefined) {
            try {
                product[field] = JSON.parse(req.body[field]);
            } catch {
                product[field] = req.body[field];
            }
        }
    });

    await product.save();

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
    });
});

//admin
exports.deleteProduct = catchAsyncError(async (req, res, next) => {

    try {
        const { productId } = req.params;

        const product = await Product.findOne({ slug: productId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const deleteFileSafe = (url) => {
            if (!url) return;
            try {
                const filename = path.basename(url);
                const filePath = path.join(__dirname, "..", "uploads", "product", filename);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.warn("⚠️ Image deletion failed:", err.message);
            }
        };

        deleteFileSafe(product.image);

        if (Array.isArray(product.images)) {
            for (const img of product.images) {
                deleteFileSafe(img.image);
                deleteFileSafe(img.longImage);
            }
        }

        await Product.deleteOne({ slug: productId });

        return res.status(200).json({
            success: true,
            message: "deleted successfully",
        });

    } catch (error) {
        console.error("Delete product error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting the product",
            error: error.message,
        });
    }
});

//admin
exports.toggleProductActive = catchAsyncError(async (req, res) => {
    try {

        const { productId } = req.params;

        const product = await Product.findOne({ slug: productId });

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        product.isActive = !product.isActive;
        await product.save();

        return res.status(200).json({
            success: true,
            message: `product "${product.name}" is now ${product.isActive ? 'active' : 'inactive'}`,
            product
        });

    } catch (error) {
        console.error("Toggle product active error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

//admin
exports.getAdminActiveProducts = catchAsyncError(async (req, res, next) => {
    try {

        const data = await Product.find({ isActive: true });
        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No products found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error(error);
        next(error); // Pass the error to global error handler
    }
});

//user
exports.getActiveCategoryProducts = catchAsyncError(async (req, res, next) => {
    try {
        const { category: categorySlug, subcategory: subCategorySlug } = req.query;

        if (!categorySlug && !subCategorySlug) {
            return res.status(400).json({ message: 'Category or Subcategory parameter is required' });
        }

        let categoryDoc;
        let subCategoryDoc;
        let filter = {};

        if (subCategorySlug) {
            // Find the category document that contains this subcategory
            categoryDoc = await Category.findOne({ "subcategories.slug": subCategorySlug }).lean();

            if (!categoryDoc) {
                return res.status(404).json({ message: 'Subcategory not found' });
            }

            // Find the subcategory inside the category document
            subCategoryDoc = categoryDoc.subcategories.find(sc => sc.slug === subCategorySlug);

            if (!subCategoryDoc) {
                return res.status(404).json({ message: 'Subcategory not found inside the category' });
            }

            // Filter products by subCategory slug
            filter.subCategory = subCategorySlug;

        } else if (categorySlug) {
            // Find category by slug
            categoryDoc = await Category.findOne({ slug: categorySlug }).lean();

            if (!categoryDoc) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Filter products by category slug
            filter.category = categorySlug;
        }

        // Fetch products by filter (category or subcategory slugs)
        const products = await Product.find(filter)
            .select('productName slug category subCategory price image seo')
            .lean();

        // Compose meta info
        let metaInfo = {};
        let category = {};


        if (subCategoryDoc) {
            // If subcategory requested, send subcategory meta + category title and slug

            metaInfo = {
                title: subCategoryDoc.title || subCategoryDoc.name,
                description: subCategoryDoc.description,
                image: subCategoryDoc.image,
                seo: subCategoryDoc.seo,
                category: {
                    title: categoryDoc.name,
                    slug: categoryDoc.slug
                }
            };
        } else if (categoryDoc) {
            // Category meta
            metaInfo = {
                title: categoryDoc.title || categoryDoc.name,
                description: categoryDoc.description,
                image: categoryDoc.image,
                seo: categoryDoc.seo,
            };
        }

        res.json({
            meta: metaInfo,
            products,
        });

    } catch (error) {
        console.error('Error fetching products by category/subcategory:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

//user
exports.getActiveSearchProducts = catchAsyncError(async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const regex = new RegExp(q, 'i');

        const products = await Product.find({
            isActive: true,
            productName: regex,
        }).select('productName category subCategory slug image price');

        res.json({ data: products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

exports.getProduct = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;
    const data = await Product.findOne({ slug: productId });
console.log(data);

    if (!data) {
        return next(new ErrorHandler('Product not found', 400));
    }

    res.status(201).json({
        success: true,
        data
    })
})
