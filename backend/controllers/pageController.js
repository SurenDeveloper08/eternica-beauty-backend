const catchAsyncError = require('../middlewares/catchAsyncError');
const About = require('../models/pageModel');
const ErrorHandler = require('../utils/errorHandler');

//admin
exports.createPageContent = catchAsyncError(async (req, res) => {
  try {
    const { page, title, description } = req.body;

    if (!page || !title || !description || !req.file) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const BASE_URL = process.env.NODE_ENV === "production"
      ? process.env.BACKEND_URL
      : `${req.protocol}://${req.get("host")}`;

    const imagePath = `${BASE_URL}/uploads/page/${req.file.filename}`;

    // Check if page already exists
    const existing = await About.findOne({ page });
    if (existing) {
      return res.status(400).json({ success: false, message: `${page} content already exists` });
    }

    const content = await About.create({
      page: page.toLowerCase(),
      title,
      description,
      image: imagePath,
    });

    res.status(201).json({ success: true, message: "Content created", data: content });
  } catch (error) {
    console.error("Create Page Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

//admin
exports.getPageContent = catchAsyncError(async (req, res) => {
  try {
    const { page } = req.params;

    if (!page) {
      return res.status(400).json({ success: false, message: "Page parameter is required" });
    }

    const content = await About.findOne({ page: page?.toLowerCase() });

    if (!content) {
      return res.status(404).json({ success: false, message: "Page content not found" });
    }

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error("Get Page Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

//admin
exports.updatePageContent = catchAsyncError(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const content = await About.findById(id);
    if (!content) {
      return res.status(404).json({ success: false, message: "Page content not found" });
    }

    if (title) content.title = title;
    if (description) content.description = description;

    if (req.file) {
      const BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;
      content.image = `${BASE_URL}/uploads/page/${req.file.filename}`;
    }

    await content.save();

    res.status(200).json({ success: true, message: "Page content updated", data: content });
  } catch (error) {
    console.error("Update Page Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

