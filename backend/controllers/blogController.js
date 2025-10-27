const catchAsyncError = require('../middlewares/catchAsyncError');
const Blog = require('../models/blogModel');
const ErrorHandler = require('../utils/errorHandler');

//admin
exports.createBlog = catchAsyncError(async (req, res, next) => {
    try {
        const {
            title,
            slug,
            description,
            sortOrder,
            status,
            metaTitle,
            metaDescription,
            metaKeywords,
            canonicalUrl
        } = req.body;

        // Basic validation
        if (!title || !slug || !description) {
            return res.status(400).json({ success: false, message: 'Title, slug, and description are required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        const imagePath = `${req.protocol}://${req.get('host')}/uploads/pages/${req.file.filename}`;

        // Check if slug already exists
        const existing = await Blog.findOne({ slug: slug.toLowerCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Slug already exists' });
        }

        const blog = await Blog.create({
            title,
            slug: slug.toLowerCase(),
            description,
            image: imagePath,
            sortOrder: sortOrder || 0,
            status: status || 'active',
            seo: {
                metaTitle,
                metaDescription,
                metaKeywords,
                canonicalUrl
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Page created successfully',
            data: blog
        });

    } catch (error) {
        console.error("Create Page Error:", error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: error.message
        });
    }
});

exports.getBlog = catchAsyncError(async (req, res) => {
  try {
    const { slug } = req.params;

    const page = await Blog.findOne({ slug: slug.toLowerCase() });

    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    res.status(200).json({ success: true, data: page });

  } catch (error) {
    console.error("Get Page Error:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

//admin
exports.getAdminBlogs = catchAsyncError(async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = search
      ? { title: { $regex: search, $options: 'i' } }
      : {};

    const total = await Blog.countDocuments(query);

    const pages = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      data: pages,
    });

  } catch (error) {
    console.error("Get All Pages Error:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

//admin
exports.updateBlog = catchAsyncError(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      description,
      sortOrder,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl
    } = req.body;

    const page = await Blog.findById(id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    // Check slug uniqueness (only if changed)
    if (slug && slug.toLowerCase() !== page.slug) {
      const slugExists = await Page.findOne({ slug: slug.toLowerCase() });
      if (slugExists) {
        return res.status(400).json({ success: false, message: 'Slug already exists' });
      }
      page.slug = slug.toLowerCase();
    }

    // Update fields if provided
    if (title) page.title = title;
    if (description) page.description = description;
    if (sortOrder !== undefined) page.sortOrder = sortOrder;
    if (status) page.status = status;

    if (!page.seo) page.seo = {};

    if (metaTitle) page.seo.metaTitle = metaTitle;
    if (metaDescription) page.seo.metaDescription = metaDescription;
    if (metaKeywords) page.seo.metaKeywords = metaKeywords;
    if (canonicalUrl) page.seo.canonicalUrl = canonicalUrl;

    if (req.file) {
      const imagePath = `${req.protocol}://${req.get('host')}/uploads/pages/${req.file.filename}`;
      page.image = imagePath;
    }

    await page.save();

    res.status(200).json({ success: true, message: 'Page updated successfully', data: page });

  } catch (error) {
    console.error("Update Page Error:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});



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