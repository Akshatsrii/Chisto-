const couponModel = require("../models/couponModel")
const userModel = require("../models/userModel")

const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, expiryDate, usageLimit, userSpecific } = req.body
    const newCoupon = new couponModel({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      expiryDate,
      usageLimit,
      userSpecific
    })
    await newCoupon.save()
    res.json({ success: true, message: "Coupon created successfully" })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const listCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.find({})
    res.json({ success: true, data: coupons })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const deleteCoupon = async (req, res) => {
  try {
    await couponModel.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: "Coupon deleted" })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body
    const user = await userModel.findById(req.userId)
    if (!user) {
      return res.json({ success: false, message: "User session not found" })
    }

    const coupon = await couponModel.findOne({ code: code.toUpperCase() })
    if (!coupon) {
      return res.json({ success: false, message: "Invalid Coupon Code" })
    }

    // Expiry check
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.json({ success: false, message: "Coupon has expired" })
    }

    // Min order amount check
    if (amount < coupon.minOrderAmount) {
      return res.json({ success: false, message: `Minimum order amount of ₹${coupon.minOrderAmount} required` })
    }

    // Usage limit check
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: false, message: "Coupon usage limit reached" })
    }

    // User specific check
    if (coupon.userSpecific && coupon.userSpecific.toLowerCase() !== user.email.toLowerCase()) {
      return res.json({ success: false, message: "This coupon is not valid for your account" })
    }

    res.json({
      success: true,
      message: "Coupon applied!",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

module.exports = {
  createCoupon,
  listCoupons,
  deleteCoupon,
  validateCoupon
}
