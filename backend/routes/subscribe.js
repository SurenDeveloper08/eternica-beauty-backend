const express = require('express');
const multer = require('multer');
const path = require('path')

const { 
   subscribeUser,
   getSubscribers
 } = require('../controllers/newsletterController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

//Admin routes
router.route('/newsletter').post(subscribeUser);
router.route('/newsletter').get(getSubscribers);

module.exports = router;