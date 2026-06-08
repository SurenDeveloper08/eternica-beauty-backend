const mongoose = require("mongoose");
const slugify = require("slugify");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
      maxlength: 100,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
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

    isFeatured: {
      type: Boolean,
      default: false,
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

// ==============================
// AUTO GENERATE UNIQUE SLUG
// ==============================

subCategorySchema.pre("save", async function (next) {

  if (!this.isModified("name")) {
    return next();
  }

  const baseSlug = slugify(this.name, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (
    await mongoose.models.SubCategory.findOne({
      slug,
      _id: { $ne: this._id },
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;

  next();
});

// INDEXES

subCategorySchema.index({ name: "text" });
subCategorySchema.index({ slug: 1 });
subCategorySchema.index({ category: 1 });
subCategorySchema.index({ isActive: 1 });
subCategorySchema.index({ isFeatured: 1 });

module.exports = mongoose.model(
  "SubCategory",
  subCategorySchema
);