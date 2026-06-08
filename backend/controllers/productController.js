// controllers/productController.js

const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const SubCategory = require("../models/SubCategory");
const Brand = require("../models/brandModel");

// =====================================
// CREATE PRODUCT
// =====================================

exports.createProduct = async (req, res) => {
    try {
        const BASE_URL =
            process.env.NODE_ENV === "production"
                ? process.env.BACKEND_URL
                : `${req.protocol}://${req.get("host")}`;

        // MAIN IMAGE
        let image = "";

        if (
            req.files &&
            req.files.image &&
            req.files.image.length > 0
        ) {
            image = `${BASE_URL}/uploads/products/${req.files.image[0].filename}`;
        }

        // GALLERY IMAGES
        let images = [];

        if (
            req.files &&
            req.files.images
        ) {
            images = req.files.images.map(
                (file) =>
                    `${BASE_URL}/uploads/products/${file.filename}`
            );
        }

        // CHECK CATEGORY
        const category =
            await Category.findById(
                req.body.category
            );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // CHECK BRAND
        const brand =
            await Brand.findById(
                req.body.brand
            );

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }

        // CHECK SUBCATEGORY
        let subCategory = null;

        if (req.body.subCategory) {
            subCategory =
                await SubCategory.findById(
                    req.body.subCategory
                );

            if (!subCategory) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Subcategory not found",
                });
            }
        }

        // CHECK SKU
        const existingSKU =
            await Product.findOne({
                sku: req.body.sku
                    .trim()
                    .toUpperCase(),
            });

        if (existingSKU) {
            return res.status(409).json({
                success: false,
                message: "SKU already exists",
            });
        }

        // SPECIFICATIONS
        let specifications = [];

        if (req.body.specifications) {
            specifications = JSON.parse(
                req.body.specifications
            );
        }

        // FEATURES
        let features = [];

        if (req.body.features) {
            features = req.body.features
                .split(",")
                .map((item) => item.trim());
        }

        // TAGS
        let tags = [];

        if (req.body.tags) {
            tags = req.body.tags
                .split(",")
                .map((item) =>
                    item.trim().toLowerCase()
                );
        }

        // CREATE PRODUCT
        const product =
            await Product.create({
                name: req.body.name.trim(),

                shortDescription:
                    req.body.shortDescription || "",

                description:
                    req.body.description || "",

                category:
                    req.body.category,

                subCategory:
                    req.body.subCategory || null,

                brand: req.body.brand,

                sku: req.body.sku
                    .trim()
                    .toUpperCase(),

                price: req.body.price,

                salePrice:
                    req.body.salePrice || 0,

                stock:
                    req.body.stock || 0,

                lowStockAlert:
                    req.body.lowStockAlert || 5,

                image,

                images,

                specifications,

                features,

                tags,

                isFeatured:
                    req.body.isFeatured ===
                    "true",

                isActive:
                    req.body.isActive ===
                    "true",

                seo: {
                    metaTitle:
                        req.body.metaTitle || "",

                    metaDescription:
                        req.body.metaDescription ||
                        "",

                    metaKeywords:
                        req.body.metaKeywords
                            ? req.body.metaKeywords
                                .split(",")
                                .map((item) =>
                                    item.trim()
                                )
                            : [],

                    canonicalUrl:
                        req.body.canonicalUrl ||
                        "",
                },
            });

        res.status(201).json({
            success: true,
            message:
                "Product created successfully",
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================
// UPDATE PRODUCT
// =====================================

exports.updateProduct = async (
    req,
    res
) => {
    try {
        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const BASE_URL =
            process.env.NODE_ENV === "production"
                ? process.env.BACKEND_URL
                : `${req.protocol}://${req.get("host")}`;

        // MAIN IMAGE
        let image = product.image;

        if (
            req.files &&
            req.files.image &&
            req.files.image.length > 0
        ) {
            image = `${BASE_URL}/uploads/products/${req.files.image[0].filename}`;
        }

        // GALLERY IMAGES
        let images = product.images;

        if (
            req.files &&
            req.files.images
        ) {
            images = req.files.images.map(
                (file) =>
                    `${BASE_URL}/uploads/products/${file.filename}`
            );
        }

        // CHECK SKU
        const existingSKU =
            await Product.findOne({
                sku: req.body.sku
                    .trim()
                    .toUpperCase(),
                _id: {
                    $ne: req.params.id,
                },
            });

        if (existingSKU) {
            return res.status(409).json({
                success: false,
                message: "SKU already exists",
            });
        }

        // SPECIFICATIONS
        let specifications = [];

        if (req.body.specifications) {
            specifications = JSON.parse(
                req.body.specifications
            );
        }

        // FEATURES
        let features = [];

        if (req.body.features) {
            features = req.body.features
                .split(",")
                .map((item) => item.trim());
        }

        // TAGS
        let tags = [];

        if (req.body.tags) {
            tags = req.body.tags
                .split(",")
                .map((item) =>
                    item.trim().toLowerCase()
                );
        }

        product.name =
            req.body.name.trim();

        product.shortDescription =
            req.body.shortDescription || "";

        product.description =
            req.body.description || "";

        product.category =
            req.body.category;

        product.subCategory =
            req.body.subCategory || null;

        product.brand =
            req.body.brand;

        product.sku = req.body.sku
            .trim()
            .toUpperCase();

        product.price =
            req.body.price;

        product.salePrice =
            req.body.salePrice || 0;

        product.stock =
            req.body.stock || 0;

        product.lowStockAlert =
            req.body.lowStockAlert || 5;

        product.image = image;

        product.images = images;

        product.specifications =
            specifications;

        product.features = features;

        product.tags = tags;

        product.isFeatured =
            req.body.isFeatured ===
            "true";

        product.isActive =
            req.body.isActive ===
            "true";

        product.seo = {
            metaTitle:
                req.body.metaTitle || "",

            metaDescription:
                req.body.metaDescription ||
                "",

            metaKeywords:
                req.body.metaKeywords
                    ? req.body.metaKeywords
                        .split(",")
                        .map((item) =>
                            item.trim()
                        )
                    : [],

            canonicalUrl:
                req.body.canonicalUrl || "",
        };

        await product.save();

        res.status(200).json({
            success: true,
            message:
                "Product updated successfully",
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================
// GET ALL PRODUCTS ADMIN
// =====================================

exports.getAllProductsAdmin =
    async (req, res) => {
        try {
            const products =
                await Product.find()
                    .populate(
                        "category",
                        "name slug"
                    )
                    .populate(
                        "subCategory",
                        "name slug"
                    )
                    .populate(
                        "brand",
                        "name slug"
                    )
                    .sort({
                        createdAt: -1,
                    });

            res.status(200).json({
                success: true,
                count: products.length,
                data: products,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================
// WEBSITE PRODUCTS
// =====================================

exports.getWebsiteProducts =
    async (req, res) => {
        try {
            const products =
                await Product.find({
                    isActive: true,
                })
                    .populate(
                        "category",
                        "name slug"
                    )
                    .populate(
                        "subCategory",
                        "name slug"
                    )
                    .populate(
                        "brand",
                        "name slug"
                    )
                    .sort({
                        createdAt: -1,
                    });

            res.status(200).json({
                success: true,
                count: products.length,
                data: products,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================
// SINGLE PRODUCT
// =====================================

exports.getSingleProduct =
    async (req, res) => {
        try {
            const product =
                await Product.findById(
                    req.params.id
                )
                    .populate(
                        "category",
                        "name slug"
                    )
                    .populate(
                        "subCategory",
                        "name slug"
                    )
                    .populate(
                        "brand",
                        "name slug"
                    );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            res.status(200).json({
                success: true,
                data: product,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================
// PRODUCT BY SLUG
// =====================================

exports.getProductBySlug = async (req, res) => {
    try {
        console.log(req.params);

        const product = await Product.findOne({
            slug: req.params.slug,
            isActive: true,
        })
            .populate("category", "name slug")
            .populate("subCategory", "name slug")
            .populate("brand", "name slug");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getSearchProducts = async (req, res) => {
    try {
        const q = req.query.q || "";

        if (!q) {
            return res.json({
                success: true,
                products: [],
            });
        }

        const products = await Product.find({
            isActive: true,
            name: {
                $regex: q,
                $options: "i",
            },
        })
            .select("name slug image")
            .limit(8)
            .lean();

        res.json({
            success: true,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// =====================================
// PRODUCTS BY CATEGORY
// =====================================

exports.getProductsByCategory = async (req, res) => {
    try {
        const category = await Category.findOne({
            slug: req.params.slug,
            isActive: true,
        }).select("name slug Title Description seo");

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const products = await Product.find({
            category: category._id,
            isActive: true,
        });

        res.status(200).json({
            success: true,

            category: {
                _id: category._id,
                name: category.name,
                slug: category.slug,
                image: category.image,
                title: category.Title,
                description: category.Description,
                seo: category.seo,
            },

            count: products.length,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================
// PRODUCTS BY SUBCATEGORY
// =====================================

exports.getProductsBySubCategory =
    async (req, res) => {
        console.log('enetered', req.params.slug);

        try {
            const subCategory =
                await SubCategory.findOne({
                    slug: req.params.slug,
                }).select("name slug Title Description seo");;

            if (!subCategory) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Subcategory not found",
                });
            }


            const products =
                await Product.find({
                    subCategory:
                        subCategory._id,
                    isActive: true,
                });

            res.status(200).json({
                success: true,

                category: {
                    _id: subCategory._id,
                    name: subCategory.name,
                    slug: subCategory.slug,
                    image: subCategory.image,
                    title: subCategory.Title,
                    description: subCategory.Description,
                    seo: subCategory.seo,
                },
                count: products.length,
                products,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================
// PRODUCTS BY BRAND
// =====================================

exports.getProductsByBrand =
    async (req, res) => {
        try {
            const brand =
                await Brand.findOne({
                    slug: req.params.slug,
                });

            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: "Brand not found",
                });
            }

            const products =
                await Product.find({
                    brand: brand._id,
                    isActive: true,
                });

            res.status(200).json({
                success: true,
                count: products.length,
                data: products,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================
// FEATURED PRODUCTS
// =====================================

exports.getFeaturedProducts =
    async (req, res) => {
        try {
            const products =
                await Product.find({
                    isFeatured: true,
                    isActive: true,
                }).sort({
                    createdAt: -1,
                });

            res.status(200).json({
                success: true,
                count: products.length,
                data: products,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================
// TOGGLE STATUS
// =====================================

exports.toggleProductStatus =
    async (req, res) => {
        try {
            const product =
                await Product.findById(
                    req.params.id
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            product.isActive =
                !product.isActive;

            await product.save();

            res.status(200).json({
                success: true,
                message:
                    product.isActive
                        ? "Product activated"
                        : "Product deactivated",
                data: product,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================
// TOGGLE FEATURED
// =====================================

exports.toggleFeaturedProduct =
    async (req, res) => {
        try {
            const product =
                await Product.findById(
                    req.params.id
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            product.isFeatured =
                !product.isFeatured;

            await product.save();

            res.status(200).json({
                success: true,
                message:
                    product.isFeatured
                        ? "Product featured"
                        : "Product unfeatured",
                data: product,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================
// DELETE PRODUCT
// =====================================

exports.deleteProduct =
    async (req, res) => {
        try {
            const product =
                await Product.findById(
                    req.params.id
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            await product.deleteOne();

            res.status(200).json({
                success: true,
                message:
                    "Product deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };