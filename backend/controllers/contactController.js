const catchAsyncError = require('../middlewares/catchAsyncError');
const Contact = require('../models/contact');
const sendContactEmail = require('../utils/email');

exports.Contact = catchAsyncError(async (req, res, next) => {

  try {
    const { name, email, phone, subject, message } = req.body;

    // Save form submission to MongoDB
    const newContact = new Contact({ name, email, phone, subject, message });
    await newContact.save();

    res.status(200).json({ success: true, message: 'Message sent and stored successfully!' });

    await sendContactEmail(process.env.ADMIN_EMAIL1, name, email, phone, subject, message);
    await sendContactEmail(process.env.ADMIN_EMAIL2, name, email, phone, subject, message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error, try again later.' });
    
  }
});

exports.getContacts = catchAsyncError(async (req, res, next) => {
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
