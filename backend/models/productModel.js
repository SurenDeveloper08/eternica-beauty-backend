// models/productModel.js

const mongoose = require("mongoose");
const slugify = require("slugify");

// =====================================
// SPECIFICATION SCHEMA
// =====================================

const specificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },

    value: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// =====================================
// PRODUCT SCHEMA
// =====================================

const productSchema = new mongoose.Schema(
  {
    // BASIC INFO

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
      unique: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // RELATIONS

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
        },

    // SKU

    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // PRICING

    price: {
      type: Number,
      min: 0,
    },

    salePrice: {
      type: Number,
      min: 0,

      validate: {
        validator: function (value) {
          return !value || value <= this.price;
        },

        message:
          "Sale price cannot be greater than price",
      },
    },

    // STOCK

    stock: {
      type: Number,
     default: 0,
      min: 0,
    },

    lowStockAlert: {
      type: Number,
      default: 5,
    },

    // IMAGES

    image: {
      type: String,
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    // SPECIFICATIONS

    specifications: [specificationSchema],

    // FEATURES

    features: [
      {
        type: String,
        trim: true,
      },
    ],

    // TAGS

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // STATUS

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // SEO

    seo: {
      metaTitle: {
        type: String,
        trim: true,
        default: "",
      },

      metaDescription: {
        type: String,
        trim: true,
        default: "",
      },

      metaKeywords: [
        {
          type: String,
          trim: true,
        },
      ],

      canonicalUrl: {
        type: String,
        trim: true,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

// =====================================
// AUTO GENERATE UNIQUE SLUG
// =====================================

productSchema.pre(
  "save",
  async function (next) {

    if (!this.isModified("name")) {
      return next();
    }

    const baseSlug = slugify(
      this.name,
      {
        lower: true,
        strict: true,
        trim: true,
      }
    );

    let slug = baseSlug;

    let counter = 1;

    while (
      await mongoose.models.Product.findOne({
        slug,
        _id: { $ne: this._id },
      })
    ) {

      slug = `${baseSlug}-${counter}`;

      counter++;

    }

    this.slug = slug;

    next();

  }
);

// =====================================
// STOCK STATUS VIRTUAL
// =====================================

productSchema.virtual(
  "stockStatus"
).get(function () {

  if (this.stock <= 0)
    return "Out of Stock";

  if (
    this.stock <= this.lowStockAlert
  ) {
    return "Low Stock";
  }

  return "In Stock";

});

// =====================================
// INDEXES
// =====================================

productSchema.index({
  name: "text",
});

productSchema.index({
  slug: 1,
});

productSchema.index({
  category: 1,
});

productSchema.index({
  subCategory: 1,
});

productSchema.index({
  brand: 1,
});

productSchema.index({
  isFeatured: 1,
});

productSchema.index({
  isActive: 1,
});

module.exports =
  mongoose.model(
    "Product",
    productSchema
  );