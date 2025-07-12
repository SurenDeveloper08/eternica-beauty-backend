const mongoose = require('mongoose');

const deliveryAddressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
});

const itemsSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    color: {
        type: String
    },
    size: {
        type: String
    },
    product: {
        slug: {
            type: String
        },
        productName: {
            type: String
        },
        price: {
            type: Number
        },
        image: {
            type: String
        },
    },
    subtotal: {
        type: String,
        required: true
    },
})
const PaymentSchema = new mongoose.Schema({
    method: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Failed'],
        default: 'Pending'
    },
    transactionId: {
        type: String,
    },
});
const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'User'
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    shippingInfo: deliveryAddressSchema,
    items: [itemsSchema],
    amount: Number,
    payment: {
        type: PaymentSchema,
        required: true,
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending',
    },
    invoice: { type: String },
    deliveryCharge: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

let orderModel = mongoose.model('Order', orderSchema);

module.exports = orderModel;