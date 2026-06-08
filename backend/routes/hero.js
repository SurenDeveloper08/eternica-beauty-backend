const express =
  require("express");

const multer =
  require("multer");

const path =
  require("path");

const router =
  express.Router();

const {
  createHero,
  updateHero,
  deleteHero,
  getAllHeroes,
  getWebsiteHero,
  getSingleHero,
  toggleHeroStatus,
} = require(
  "../controllers/heroController"
);

// ======================================
// MULTER
// ======================================
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '..', '/uploads/hero'))
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
})

// ======================================
// CREATE
// ======================================

router.post(
  "/hero/new",
  upload.fields([
    {
      name:
        "desktopImage",
      maxCount: 1,
    },
    {
      name:
        "mobileImage",
      maxCount: 1,
    },
  ]),
  createHero
);

// ======================================
// UPDATE
// ======================================

router.put(
  "/hero/:id",
  upload.fields([
    {
      name:
        "desktopImage",
      maxCount: 1,
    },
    {
      name:
        "mobileImage",
      maxCount: 1,
    },
  ]),
  updateHero
);

// ======================================
// DELETE
// ======================================

router.delete(
  "/hero/:id",
  deleteHero
);

// ======================================
// ADMIN ALL
// ======================================

router.get(
  "/admin/hero/all",
  getAllHeroes
);

// ======================================
// WEBSITE HERO
// ======================================

router.get(
  "/hero",
  getWebsiteHero
);

// ======================================
// SINGLE
// ======================================

router.get(
  "/hero/:id",
  getSingleHero
);

// ======================================
// STATUS
// ======================================

router.patch(
  "/hero/status/:id",
  toggleHeroStatus
);

module.exports = router;