const express = require('express');
const { dashboardStats } = require('../controllers/dashController');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');

router.route('/dashboard-stats').get( dashboardStats);



module.exports = router;