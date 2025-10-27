const mongoose = require("mongoose");
const slugify = require('slugify');

const specificationSchema = new mongoose.Schema({
    key: String,
    value: String,
});

const seoSchema = new mongoose.Schema({
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: { type: String },
    canonicalUrl: { type: String }
});

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: null },
    description: { type: String },
    features: [{ type: String }],
    whyChoose: [{ type: String }],
    instructions: [{ type: String }],
    overview: { type: String },
    specifications: [specificationSchema],
    stock: { type: Number },
    deliveryDays: { type: Number },
    price: { type: Number },
    oldPrice: { type: Number },
    image: { type: String },
    brand: { type: String},
    variants: [
        {
            color: String,
            colorCode: String,     // optional hex or image
            images: [String],      // images for this color variant
            longImages: [String],
            sizes: [
                {
                    name: String,
                    price: Number,
                    stock: Number,
                    images: [String],    // optional size-specific images
                    longImages: [String],
                }
            ],
            price: Number,         // optional: price for color-only variant
            stock: Number          // optional: stock for color-only variant
        }
    ],
    images: [{
        image: {
            type: String,
            required: true
        }
    }],
    longImages: [{ type: String }],
    sellGlobally: { type: Boolean, default: true },
    restrictedCountries: [String], // ['SA', 'IR']      
    allowedCountries: [String],    // used if sellGlobally is false
    isActive: { type: Boolean, default: true },
    seo: seoSchema,
}, { timestamps: true });

productSchema.pre('validate', async function (next) {
    if (!this.isModified('productName')) return next();

    if (this.productName) {
        let baseSlug = slugify(this.productName, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        console.log(`Setting slug to: ${slug} for productName: ${this.productName}`);

        this.slug = slug;
    }
    next();
});


//routes
module.exports = mongoose.model("Product", productSchema);
