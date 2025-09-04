const catchAsyncError = require('../middlewares/catchAsyncError');
const Blog = require('../models/blogModel');
const ErrorHandler = require('../utils/errorHandler');

exports.addBlog = catchAsyncError(async (req, res, next) => {
    let BASE_URL =
        process.env.NODE_ENV === "production"
            ? process.env.BACKEND_URL
            : `${req.protocol}://${req.get("host")}`;

    const { title, content, metaTitle, metaDescription, metaKeywords, canonicalUrl, isActive } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // Validate required fields
    if (!title || !slug || !content) {
        return res.status(400).json({ message: "Title, slug, and content are required" });
    }

    // Check for duplicate slug
    const exists = await Blog.findOne({ slug });
    if (exists) {
        return res.status(409).json({ message: "Slug already exists" });
    }

    // Build data object
    const blogData = {
        title,
        slug,
        content,
        metaTitle,
        metaDescription,
        metaKeywords,
        canonicalUrl,
        isActive: isActive !== undefined ? isActive : true,
    };

    // ✅ If an image was uploaded by multer
    if (req.file) {
        blogData.image = `${BASE_URL}/uploads/blog/${req.file.filename}`;
    }

    // Create blog
    const blog = await Blog.create(blogData);

    res.status(201).json({
        success: true,
        data: blog,
    });
});

exports.getAllBlogs = catchAsyncError(async (req, res, next) => {
    const { active } = req.query;
    let filter = {};
    if (active !== undefined) {
        filter.isActive = active === 'true';
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        data: blogs,
    });
});

exports.getOneBlog = catchAsyncError(async (req, res, next) => {

    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(201).json({
        success: true,
        data: blog,
    });
});

exports.updateBlog = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    const updateData = { ...req.body };

    if (req.file) {
        updateData.image = `${BASE_URL}/uploads/blog/${req.file.filename}`;
    }

    const updatedBlog = await Blog.findOneAndUpdate(
        { slug },
        updateData,
        { new: true, runValidators: true }
    );
    if (!updatedBlog) {
        return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(201).json({
        success: true,
        data: updatedBlog,
    });
});

exports.deleteBlog = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    // const blog = await Blog.findOneAndUpdate({ slug }, { isActive: false }, { new: true });
    const blog = await Blog.findOneAndDelete({ slug });
    if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(201).json({
        success: true,
        message: 'Blog deleted successfully',
    });
});