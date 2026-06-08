// routes/productRoutes.js

const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  createProduct,
  updateProduct,
  getAllProductsAdmin,
  getWebsiteProducts,
  getSingleProduct,
  getProductBySlug,
  toggleProductStatus,
  toggleFeaturedProduct,
  deleteProduct,
  getSearchProducts,
  getProductsByCategory,
  getProductsBySubCategory,
  getProductsByBrand,
  getFeaturedProducts,
} = require("../controllers/productController");

const router = express.Router();

// =====================================
// MULTER
// =====================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      path.join(
        __dirname,
        "..",
        "/uploads/products"
      )
    );
  },

  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({ storage });

// =====================================
// CREATE PRODUCT
// =====================================

router.route("/product/new").post(
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  createProduct
);

// =====================================
// UPDATE PRODUCT
// =====================================

router.route("/product/:id").put(
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  updateProduct
);

// =====================================
// DELETE PRODUCT
// =====================================

router.route("/product/:id").delete(
  deleteProduct
);

// =====================================
// ADMIN PRODUCTS
// =====================================

router.route("/admin/product/all").get(
  getAllProductsAdmin
);

// =====================================
// WEBSITE PRODUCTS
// =====================================

router.route("/products").get(
  getWebsiteProducts
);
//search
router.route("/product/search").get(
  getSearchProducts
);
// =====================================
// SINGLE PRODUCT
// =====================================

router.route("/product/:id").get(
  getSingleProduct
);

// =====================================
// PRODUCT BY SLUG
// =====================================

router.route("/product/slug/:slug").get(
  getProductBySlug
);

// =====================================
// CATEGORY PRODUCTS
// =====================================

router.route("/products/category/:slug").get(
  getProductsByCategory
);

// =====================================
// SUBCATEGORY PRODUCTS
// =====================================

router.route("/products/subcategory/:slug").get(
  getProductsBySubCategory
);

// =====================================
// BRAND PRODUCTS
// =====================================

router.route("/products/brand/:slug").get(
  getProductsByBrand
);

// =====================================
// FEATURED PRODUCTS
// =====================================

router.route("/featured/products").get(
  getFeaturedProducts
);

// =====================================
// STATUS TOGGLE
// =====================================

router.route("/product/status/:id").patch(
  toggleProductStatus
);

// =====================================
// FEATURED TOGGLE
// =====================================

router.route("/product/featured/:id").patch(
  toggleFeaturedProduct
);

module.exports = router;