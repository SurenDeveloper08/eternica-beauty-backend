const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: "", trim: true },
      address: { type: String, required: true, trim: true },
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          default: null,
        },
        name: { type: String, required: true },
        image: { type: String, default: "" },
        qty: { type: Number, required: true, min: 1 },
        price: { type: Number, default: 0 },
      },
    ],

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    orderNumber: {
      type: String,
      unique: true,
      index: true,
      default: null,
    },
  },
  { timestamps: true }
);

// AUTO ORDER NUMBER
orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber =
      "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);