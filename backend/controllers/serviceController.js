const Service = require("../models/serviceModel");

// =====================================
// CREATE SERVICE
// =====================================

exports.createService = async (req, res) => {
  try {
    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    let image = "";

    if (req.file) {
      image = `${BASE_URL}/uploads/services/${req.file.filename}`;
    }

    const existing = await Service.findOne({
      name: req.body.name.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Service already exists",
      });
    }

    const service = await Service.create({
      name: req.body.name,
      shortDescription:
        req.body.shortDescription || "",

      description:
        req.body.description || "",

      image,

      features: req.body.features
        ? req.body.features
          .split(",")
          .map((item) => item.trim())
        : [],

      benefits: req.body.benefits
        ? req.body.benefits
          .split(",")
          .map((item) => item.trim())
        : [],

      faq: req.body.faq
        ? JSON.parse(req.body.faq)
        : [],

      displayOrder:
        req.body.displayOrder || 0,

      isFeatured:
        req.body.isFeatured === "true",

      isActive:
        req.body.isActive === "true",

      seo: {
        metaTitle:
          req.body.metaTitle || "",

        metaDescription:
          req.body.metaDescription || "",

        metaKeywords:
          req.body.metaKeywords
            ? req.body.metaKeywords
              .split(",")
              .map((item) => item.trim())
            : [],

        canonicalUrl:
          req.body.canonicalUrl || "",
      },
    });

    res.status(201).json({
      success: true,
      message:
        "Service created successfully",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// UPDATE SERVICE
// =====================================

exports.updateService = async (req, res) => {
  try {
    const service =
      await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    let image = service.image;

    if (req.file) {
      image = `${BASE_URL}/uploads/services/${req.file.filename}`;
    }

    const existing = await Service.findOne({
      name: req.body.name.trim(),
      _id: { $ne: req.params.id },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Service already exists",
      });
    }

    service.name =
      req.body.name || service.name;

    service.shortDescription =
      req.body.shortDescription || "";

    service.description =
      req.body.description || "";

    service.image = image;

    service.features =
      req.body.features
        ? req.body.features
          .split(",")
          .map((item) => item.trim())
        : [];

    service.benefits =
      req.body.benefits
        ? req.body.benefits
          .split(",")
          .map((item) => item.trim())
        : [];

    service.faq = req.body.faq
      ? JSON.parse(req.body.faq)
      : [];

    service.displayOrder =
      req.body.displayOrder || 0;

    service.isFeatured =
      req.body.isFeatured === "true";

    service.isActive =
      req.body.isActive === "true";

    service.seo = {
      metaTitle:
        req.body.metaTitle || "",

      metaDescription:
        req.body.metaDescription || "",

      metaKeywords:
        req.body.metaKeywords
          ? req.body.metaKeywords
            .split(",")
            .map((item) => item.trim())
          : [],

      canonicalUrl:
        req.body.canonicalUrl || "",
    };

    await service.save();

    res.status(200).json({
      success: true,
      message:
        "Service updated successfully",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// ADMIN SERVICES
// =====================================

exports.getAllServicesAdmin =
  async (req, res) => {
    try {
      const services =
        await Service.find().sort({
          displayOrder: 1,
          createdAt: -1,
        });

      res.status(200).json({
        success: true,
        count: services.length,
        data: services,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// =====================================
// WEBSITE SERVICES
// =====================================

exports.getWebsiteServices =
  async (req, res) => {
    try {
      const services =
        await Service.find({
          isActive: true,
        }).sort({
          displayOrder: 1,
          createdAt: -1,
        });

      res.status(200).json({
        success: true,
        count: services.length,
        data: services,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// =====================================
// SINGLE SERVICE
// =====================================

exports.getSingleService =
  async (req, res) => {
    try {
      const service =
        await Service.findById(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service not found",
        });
      }

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// =====================================
// SERVICE BY SLUG
// =====================================

exports.getServiceBySlug =
  async (req, res) => {
    try {
      const service =
        await Service.findOne({
          slug: req.params.slug,
          isActive: true,
        });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      res.status(200).json({
        success: true,
        service,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// =====================================
// FEATURED SERVICES
// =====================================

exports.getFeaturedServices =
  async (req, res) => {
    try {
      const services =
        await Service.find({
          isFeatured: true,
          isActive: true,
        }).sort({
          displayOrder: 1,
        });

      res.status(200).json({
        success: true,
        count: services.length,
        data: services,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// =====================================
// TOGGLE STATUS
// =====================================

exports.toggleServiceStatus =
  async (req, res) => {
    try {
      const service =
        await Service.findById(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service not found",
        });
      }

      service.isActive =
        !service.isActive;

      await service.save();

      res.status(200).json({
        success: true,
        message:
          service.isActive
            ? "Service activated"
            : "Service deactivated",
        data: service,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// =====================================
// TOGGLE FEATURED
// =====================================

exports.toggleFeaturedService =
  async (req, res) => {
    try {
      const service =
        await Service.findById(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service not found",
        });
      }

      service.isFeatured =
        !service.isFeatured;

      await service.save();

      res.status(200).json({
        success: true,
        message:
          service.isFeatured
            ? "Service featured"
            : "Service unfeatured",
        data: service,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// =====================================
// DELETE SERVICE
// =====================================

exports.deleteService =
  async (req, res) => {
    try {
      const service =
        await Service.findById(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service not found",
        });
      }

      await service.deleteOne();

      res.status(200).json({
        success: true,
        message:
          "Service deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };