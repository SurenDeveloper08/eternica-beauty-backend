const express = require('express');
const multer = require('multer');
const path = require('path')

const {
  createBlog,
  getBlog,
  addBlog,
  getAllBlogs,
  getOneBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // store files inside /uploads/product
    cb(null, path.join(__dirname, '..', 'uploads/blog'));
  },
  filename: function (req, file, cb) {
    // get extension
    const ext = path.extname(file.originalname).toLowerCase();

    // get base name without extension
    const baseName = path.basename(file.originalname, ext);

    // sanitize base name (remove spaces and special characters)
    const safeName = baseName
      .trim()
      .replace(/\s+/g, '_')        // spaces to underscores
      .replace(/[^a-zA-Z0-9_-]/g, ''); // only keep safe chars

    // add timestamp to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    // final filename
    const finalName = `${safeName}_${uniqueSuffix}${ext}`;
    cb(null, finalName);
  },
});

// Create the multer upload instance
const upload = multer({ storage });

//Web routes
router.route('/blog').get(getAllBlogs)
router.route('/blog/:slug').get(getOneBlog);
//Admin routes
router.route('/admin/blog/new').post(isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), addBlog);
router.route('/admin/blog/:slug').put(isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), updateBlog);
router.route('/admin/blog/:slug').get(isAuthenticatedUser, authorizeRoles('admin'), getOneBlog);
router.route('/admin/blogs').get(isAuthenticatedUser, authorizeRoles('admin'), getAllBlogs);
router.route('/admin/blog/:slug').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteBlog);

router.route('/admin/blog/new').post(
  // isAuthenticatedUser, authorizeRoles('admin'),
  upload.single('image'), createBlog);

router.route('/admin/blog/:slug').get(
  // isAuthenticatedUser, authorizeRoles('admin'), 
  getBlog);
module.exports = router;    