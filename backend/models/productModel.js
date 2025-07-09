const mongoose = require("mongoose");
const slugify = require('slugify');
const sizeSchema = new mongoose.Schema({
    name: String,
    quantity: Number,
    price: Number,
});

const specificationSchema = new mongoose.Schema({
    key: String,
    value: String,
});
const descriptionSchema = new mongoose.Schema({
    description: String
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
    subCategory:{ type: String, required: true },
    descriptions: [{ type: String }],
    highlights: [{ type: String }],
    overview: { type: String },
    specifications: [specificationSchema],
    colors: [{ type: String }],
    sizes: [sizeSchema],
    stock: { type: Number, default: true },
    deliveryDays: { type: Number, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    image: { type: String },
    brand: { type: String, default: 'Brand not specified' },
    images: [{
        image: {
            type: String,
            required: true
        }
    }],
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



module.exports = mongoose.model("Product", productSchema);
