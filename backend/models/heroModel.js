const mongoose = require("mongoose");

const heroSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },


    description: {
      type: String,
      default: "",
    },

    desktopImage: {
      type: String,
      default: "",
    },

    mobileImage: {
      type: String,
      default: "",
    },

    whatsappLink: {
      type: String,
      default: "",
    },

    phoneNumber: {
      type: String,
      default: "",
    },

    quoteButtonText: {
      type: String,
      default: "Get Quote",
    },

    callButtonText: {
      type: String,
      default: "Call Now",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Hero",
  heroSchema
);