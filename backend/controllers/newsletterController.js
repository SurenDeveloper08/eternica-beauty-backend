const catchAsyncError = require('../middlewares/catchAsyncError');
const Newsletter = require('../models/Newsletter');
const ErrorHandler = require('../utils/errorHandler');

exports.subscribeUser = catchAsyncError(async (req, res, next) => {

    const { email } = req.body;
   
    try {
        const existing = await Newsletter.findOne({ email }); 
        if (existing) return res.status(201).json({ message: 'Already subscribed' });

        const subscriber = new Newsletter({ email });
        await subscriber.save();
        res.status(201).json({ message: 'Subscribed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


exports.getSubscribers = catchAsyncError(async (req, res, next) => {
    try {
        const data = await Newsletter.find().sort({ subscribedAt: -1 });
        res.status(201).json({
            success: true,
            data
        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})
