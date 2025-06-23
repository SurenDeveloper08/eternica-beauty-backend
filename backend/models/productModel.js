const mongoose = require("mongoose");

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

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory", required: true },
    descriptions: [{ type: String }],
    highlights: [{ type: String }],
    overview: { type: String },
    specifications: [specificationSchema],
    colors: [{ type: String }],
    sizes: [sizeSchema],
    stock: { type: Boolean, default: true },
    deliveryDays: { type: Number, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    image: { type: String },
    brand: { type: String, default:'Brand not specified' },
    images: [{
        image: {
            type: String,
            required: true
        }
    }],
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isBestDeal: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
