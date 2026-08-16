const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  discountType: {
    type: String,
    enum: ["fixed", "percentage"],
    default: "fixed"
  },
  discountValue: {
    type: Number,
    required: true
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: 100
  },
  usedCount: {
    type: Number,
    default: 0
  },
  userSpecific: {
    type: String,
    default: "" // User email if restricted, else empty
  },
  isFirstOrderOnly: {
    type: Boolean,
    default: false
  },
  categorySpecific: {
    type: String,
    default: "" // Category name if restricted, else empty
  },
  totalDiscountGiven: {
    type: Number,
    default: 0
  }
})

const couponModel = mongoose.models.coupon || mongoose.model("coupon", couponSchema)
module.exports = couponModel
