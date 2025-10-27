const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
  page: {
    type: String,
    required: [true, "Page name is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  image: {
    type: String,
    required: [true, "Image is required"],
  },
}, { timestamps: true });

module.exports = mongoose.model("About", aboutSchema);
