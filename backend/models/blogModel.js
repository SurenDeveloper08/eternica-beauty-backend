const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    image: String,
    metaTitle: String,
    metaDescription: String,
    metaKeywords: String,
    canonicalUrl: String,   
    isActive: { type: Boolean, default: true },
},
    { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
