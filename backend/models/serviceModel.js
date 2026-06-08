const mongoose = require("mongoose");
const slugify = require("slugify");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    // BASIC
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      unique: true,
      maxlength: 150,
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
      default: "",
    },

    // IMAGE
    image: {
      type: String,
      default: "",
    },

    // FEATURES
    features: [
      {
        type: String,
        trim: true,
      },
    ],

    // BENEFITS
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],



    // FAQ
    faq: [faqSchema],

    // DISPLAY
    displayOrder: {
      type: Number,
      default: 0,
    },

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

// Unique Slug
serviceSchema.pre("save", async function (next) {
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
    await mongoose.models.Service.findOne({
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

serviceSchema.index({ name: "text" });
serviceSchema.index({ slug: 1 });
serviceSchema.index({ isFeatured: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ displayOrder: 1 });

module.exports = mongoose.model(
  "Service",
  serviceSchema
);