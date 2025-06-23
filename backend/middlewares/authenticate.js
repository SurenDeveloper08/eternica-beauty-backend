const ErrorHandler = require("../utils/errorHandler");
const User = require('../models/userModel')
const catchAsyncError = require("./catchAsyncError");
const jwt = require('jsonwebtoken');

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Please login first.'
        });
    }
    const token = authHeader.split(' ')[1];
    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = await User.findById(decoded.id)
           
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
    next();
})

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role ${req.user.role} is not allowed`, 401))
        }
        next()
    }
}   