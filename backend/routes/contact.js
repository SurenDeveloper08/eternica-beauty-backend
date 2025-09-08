const express = require('express');
const multer = require('multer');
const path = require('path')

const { 
  Contact
 } = require('../controllers/contactController');
const router = express.Router();

//Admin routes
router.route('/contact').post(Contact);

module.exports = router;