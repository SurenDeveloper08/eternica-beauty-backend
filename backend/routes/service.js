// ===============================================
// routes/serviceRoutes.js
// ===============================================

const express = require("express");

const multer = require("multer");

const path = require("path");

const {
  createService,
  updateService,
  deleteService,
  getAllServicesAdmin,
  getWebsiteServices,
  getSingleService,
  getServiceBySlug,
  toggleServiceStatus,
  toggleFeaturedService,
  getFeaturedServices,
} = require("../controllers/serviceController");

const router = express.Router();

// =====================================
// MULTER
// =====================================

const upload = multer({
  storage: multer.diskStorage({

    destination: function (req, file, cb) {

      cb(
        null,
        path.join(
          __dirname,
          "..",
          "/uploads/services"
        )
      );

    },

    filename: function (req, file, cb) {

      cb(null, file.originalname);

    },

  }),
});

// =====================================
// CREATE SERVICE
// =====================================

router.route("/service/new").post(
  upload.single("image"),
  createService

);

// =====================================
// UPDATE SERVICE
// =====================================

router.route("/service/:id").put(
  upload.single("image"),

  updateService

);

// =====================================
// DELETE SERVICE
// =====================================

router.route("/service/:id").delete(
  deleteService
);

// =====================================
// ADMIN SERVICES
// =====================================

router.route("/admin/service/all").get(
  getAllServicesAdmin
);

// =====================================
// WEBSITE SERVICES
// =====================================

router.route("/services").get(
  getWebsiteServices
);

// =====================================
// SINGLE SERVICE
// =====================================

router.route("/service/:id").get(
  getSingleService
);

// =====================================
// SERVICE BY SLUG
// =====================================

router.route("/service/slug/:slug").get(
  getServiceBySlug
);

// =====================================
// FEATURED SERVICES
// =====================================

router.route("/featured/services").get(
  getFeaturedServices
);

// =====================================
// TOGGLE STATUS
// =====================================

router.route("/service/status/:id").patch(
  toggleServiceStatus
);

// =====================================
// TOGGLE FEATURED
// =====================================

router.route("/service/featured/:id").patch(
  toggleFeaturedService
);

module.exports = router;