const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cta: { type: String, required: true },
  link: { type: String, required: true },
  position: { type: String, enum: ["left", "center", "right"], default: "center" },
  image: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const router = mongoose.model('Banner', bannerSchema);
module.exports = router;
