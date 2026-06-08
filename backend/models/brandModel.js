const mongoose = require("mongoose");
const slugify = require("slugify");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      unique: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    Title: {
      type: String,
      trim: true,
      default: "",
    },

    Description: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

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

brandSchema.pre(
  "save",
  async function (next) {

    // ONLY WHEN NAME CHANGES

    if (!this.isModified("name")) {
      return next();
    }

    // CREATE BASE SLUG

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

    // CHECK DUPLICATE SLUG

    while (
      await mongoose.models.Brand.findOne({
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
// INDEXES
// =====================================

brandSchema.index({
  name: "text",
});

brandSchema.index({
  slug: 1,
});

brandSchema.index({
  isActive: 1,
});

module.exports =
  mongoose.model(
    "Brand",
    brandSchema
  );