const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const sendEmail = require('../utils/email');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwt');
const crypto = require('crypto')
const otpStore = require('../utils/otpStore');
const { sendOtpEmail } = require('../utils/email');
const bcrypt = require('bcryptjs');
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { name, email, phone, password, role } = req.body;

    let user = await User.findOne({ email });

    if (user) {
        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "User already exists. Please login." });
        } else {
            // User exists but not verified → resend OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpire = Date.now() + 10 * 60 * 1000;

            user.name = name;       // optional: update name
            user.phone = phone;     // optional: update phone
            user.password = password; // optional: update password
            user.role = role;
            user.otp = otp;
            user.otpExpire = otpExpire;
            await user.save();

            await sendOtpEmail(email, name, otp);

            return res.status(200).json({
                success: true,
                message: "New OTP sent to your email.",
                email
            });
        }
    }

    // New user → create user and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000;

    user = await User.create({
        name,
        email,
        phone,
        password,
        role,
        otp,
        otpExpire
    });

    await sendOtpEmail(email, name, otp);

    res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify to complete registration.",
        email
    });
});


exports.verifyOtp = catchAsyncError(async (req, res, next) => {
    const { email, otp } = req.body;

    // 1️ Find the user including OTP fields
    const user = await User.findOne({ email }).select("+otp +otpExpire");

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "No account found with this email. Please sign up first."
        });
    }

    // 2️ Check if user is already verified
    if (user.isVerified) {
        return res.status(200).json({
            success: true,
            message: "Account already verified. Please login."
        });
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpire) {
        return res.status(400).json({
            success: false,
            message: "No OTP found. Please request a new one."
        });
    }

    //  Check if OTP expired
    if (user.otpExpire.getTime() < Date.now()) {
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();
        return res.status(400).json({
            success: false,
            message: "OTP expired. Please request a new one."
        });
    }

    //  Validate OTP
    if (user.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP. Please enter the correct code."
        });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    //  Send JWT token
    sendToken(user, 200, res);
});


//Login User - /api/v1/login
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return next(new ErrorHandler('Please enter email & password', 400))
    }

    //finding the user database
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }
    if (!user?.isVerified) return res.status(403).json({ success: false, message: 'Invalid email or password' });
    
    if (!await user.isValidPassword(password)) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }
    sendToken(user, 201, res)
})

// controllers/authController.js
exports.resendOtp = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ success: false, message: "No account found. Please sign up first." });
    }

    // Already verified
    if (user.isVerified) {
        return res.status(200).json({ success: true, message: "Account already verified. Please login." });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendOtpEmail(email, user.name, otp);

    res.status(200).json({ success: true, message: "OTP resent to your email." });
});

//Logout - /api/v1/logout
exports.logoutUser = (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
        .status(200)
        .json({
            success: true,
            message: "Loggedout"
        })

}

exports.addAddress = catchAsyncError(async (req, res, next) => {

    try {
        const userId = req.user._id;

        const {
            name,
            phone,
            email,
            address,
            country,
            countryCode,
            city,
            zipCode,
            isDefault
        } = req.body;


        // Basic validation
        if (!name || !email || !phone || !address || !country || !countryCode || !city || !zipCode) {

            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled.'
            });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // If this address is set to default, unset previous default
        if (isDefault) {
            user.addresses.forEach(addr => (addr.isDefault = false));
        }
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        user.addresses.push({
            name: capitalizedName,
            phone,
            email,
            address,
            country,
            countryCode,
            city,
            zipCode,
            isDefault: !!isDefault
        });
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Address added successfully.',
            addresses: user.addresses
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }

});

exports.getAddress = catchAsyncError(async (req, res, next) => {
    try {
        const data = await User.findById(req.user._id);

        if (!data) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
})

exports.setDefaultAddress = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id;
    const addressId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Unset previous defaults
    user.addresses.forEach(addr => (addr.isDefault = false));

    // Set the new default
    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    address.isDefault = true;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Default address updated successfully',
        addresses: user.addresses
    });
})
exports.updateAddress = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const addressId = req.params.id;

        const {
            name,
            phone,
            email,
            address,
            country,
            countryCode,
            city,
            zipCode,
            isDefault
        } = req.body;

        // Basic validation
        if (!name || !email || !phone || !address || !country || !countryCode || !city || !zipCode) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled.'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const addressToUpdate = user.addresses.id(addressId);
        if (!addressToUpdate) {
            return res.status(404).json({ success: false, message: 'Address not found.' });
        }

        // If isDefault is true, unset other default addresses
        if (isDefault) {
            user.addresses.forEach(addr => (addr.isDefault = false));
        }
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        Object.assign(addressToUpdate, {
            name: capitalizedName,
            phone,
            email,
            address,
            country,
            countryCode,
            city,
            zipCode,
            isDefault: !!isDefault
        });
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Address updated successfully.',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Update Address Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

//Forgot Password - /api/v1/password/forgot
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler('User not found with this email', 404))
    }

    const resetToken = user.getResetToken();
    await user.save({ validateBeforeSave: false })


    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    //Create reset url
    const resetUrl = `${BASE_URL}/password/reset/${resetToken}`;

    const message = `Your password reset url is as follows \n\n 
    ${resetUrl} \n\n If you have not requested this email, then ignore it.`;

    try {
        sendEmail({
            email: user.email,
            subject: "cart Password Recovery",
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message), 500)
    }

})

//Reset Password - /api/v1/password/reset/:token
exports.resetPassword = catchAsyncError(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordTokenExpire: {
            $gt: Date.now()
        }
    })

    if (!user) {
        return next(new ErrorHandler('Password reset token is invalid or expired'));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Password does not match'));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false })
    sendToken(user, 201, res)

})

//Get User Profile - /api/v1/myprofile
exports.getUserProfile = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id)
    res.status(200).json({
        success: true,
        user
    })
})

//Change Password  - api/v1/password/change
exports.changePassword = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
    //check old password
    if (!await user.isValidPassword(req.body.oldPassword)) {
        return next(new ErrorHandler('Old password is incorrect', 401));
    }

    //assigning new password
    user.password = req.body.password;
    await user.save();
    res.status(200).json({
        success: true,
    })
})

//Update Profile - /api/v1/update
exports.updateProfile = catchAsyncError(async (req, res, next) => {
    let newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    let avatar;

    let BASE_URL = process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : `${req.protocol}://${req.get("host")}`;

    if (req.file) {
        avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`
        newUserData = { ...newUserData, avatar }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true,
        user
    })

})

//Admin: Get All Users - /api/v1/admin/users
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
})

//Admin: Get Specific User - api/v1/admin/user/:id
exports.getUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`))
    }
    res.status(200).json({
        success: true,
        user
    })
});

//Admin: Update User - api/v1/admin/user/:id
exports.updateUser = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true,
        user
    })
})

//Admin: Delete User - api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`))
    }
    await user.remove();
    res.status(200).json({
        success: true,
    })
})
