const express = require('express');
const multer = require('multer');
const path = require('path')

const {
  createContact,
  getAllContacts,
  getContactById,
  deleteContact,
} = require('../controllers/contactController');
const router = express.Router();

//Admin routes
router.route('/contact').post(createContact);
router.route('/admin/contact').get(getAllContacts);
router.route('/contact/:id').get(getContactById);
router.route('/contact/:id').delete(deleteContact);

module.exports = router;

