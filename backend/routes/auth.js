const express = require('express');
const multer = require('multer');
const path = require('path')

const upload = multer({storage: multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join( __dirname,'..' , 'uploads/user' ) )
    },
    filename: function(req, file, cb ) {
        cb(null, file.originalname)
    }
}) })


const { 
    addAddress,
    registerUser,
    verifyOtp,
    getAddress,
    setDefaultAddress,
    updateAddress,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    changePassword,
    updateProfile,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    resendOtp
 } = require('../controllers/authController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')

router.route('/login').post(loginUser); 
router.route('/register').post(upload.single('avatar'), registerUser);
router.route('/verify').post(verifyOtp);
router.route('/resend').post(resendOtp);
router.route('/logout').get(logoutUser); 


router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').post(resetPassword);
router.route('/password/change').put(isAuthenticatedUser, changePassword);
router.route('/myprofile').get(isAuthenticatedUser, getUserProfile);
router.route('/update').put(isAuthenticatedUser,upload.single('avatar'), updateProfile);

router.route('/address/add').post(isAuthenticatedUser,addAddress);
router.route('/address/get').get(isAuthenticatedUser,getAddress);
router.route('/address/set/:id').put(isAuthenticatedUser,setDefaultAddress );
router.route('/address/update/:id').put(isAuthenticatedUser,updateAddress );

//Admin routes
router.route('/admin/users').get(isAuthenticatedUser,authorizeRoles('admin'), getAllUsers);
router.route('/admin/user/:id').get(isAuthenticatedUser,authorizeRoles('admin'), getUser)
                                .put(isAuthenticatedUser,authorizeRoles('admin'), updateUser)
                                .delete(isAuthenticatedUser,authorizeRoles('admin'), deleteUser);


module.exports = router;