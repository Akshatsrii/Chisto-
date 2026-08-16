const couponModel = require("../models/couponModel")
const userModel = require("../models/userModel")
const orderModel = require("../models/orderModel")
const foodModel = require("../models/foodModel")

const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, expiryDate, usageLimit, userSpecific, isFirstOrderOnly, categorySpecific } = req.body
    const newCoupon = new couponModel({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      expiryDate,
      usageLimit,
      userSpecific,
      isFirstOrderOnly: isFirstOrderOnly || false,
      categorySpecific: categorySpecific || ""
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

const checkCouponValidity = async (coupon, user, amount, cartItems = []) => {
  if (new Date() > new Date(coupon.expiryDate)) return { valid: false, message: "Coupon has expired" }
  if (amount < coupon.minOrderAmount) return { valid: false, message: `Minimum order amount of ₹${coupon.minOrderAmount} required` }
  if (coupon.usedCount >= coupon.usageLimit) return { valid: false, message: "Coupon usage limit reached" }
  if (coupon.userSpecific && coupon.userSpecific.toLowerCase() !== user.email.toLowerCase()) return { valid: false, message: "This coupon is not valid for your account" }
  
  if (coupon.isFirstOrderOnly) {
    const orderCount = await orderModel.countDocuments({ userId: user._id })
    if (orderCount > 0) return { valid: false, message: "This coupon is valid for first-time orders only" }
  }

  if (coupon.categorySpecific && cartItems.length > 0) {
    // Check if any cart item belongs to the required category
    const hasCategory = cartItems.some(item => item.category && item.category.toLowerCase() === coupon.categorySpecific.toLowerCase())
    if (!hasCategory) return { valid: false, message: `This coupon requires at least one item from the '${coupon.categorySpecific}' category` }
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((coupon.discountValue / 100) * amount);
  } else {
    discount = coupon.discountValue;
  }
  // Discount cannot exceed amount
  discount = Math.min(discount, amount);

  return { valid: true, discount }
}

const validateCoupon = async (req, res) => {
  try {
    const { code, amount, cartItems } = req.body
    const user = await userModel.findById(req.userId)
    if (!user) return res.json({ success: false, message: "User session not found" })

    const coupon = await couponModel.findOne({ code: code.toUpperCase() })
    if (!coupon) return res.json({ success: false, message: "Invalid Coupon Code" })

    const result = await checkCouponValidity(coupon, user, amount, cartItems || [])
    if (!result.valid) return res.json({ success: false, message: result.message })

    res.json({
      success: true,
      message: "Coupon applied!",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount: result.discount
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const autoApplyCoupon = async (req, res) => {
  try {
    const { amount, cartItems } = req.body
    const user = await userModel.findById(req.userId)
    if (!user) return res.json({ success: false, message: "User session not found" })

    const activeCoupons = await couponModel.find({ expiryDate: { $gt: new Date() } })
    let bestCoupon = null
    let maxDiscount = 0

    for (const coupon of activeCoupons) {
      const result = await checkCouponValidity(coupon, user, amount, cartItems || [])
      if (result.valid && result.discount > maxDiscount) {
        maxDiscount = result.discount
        bestCoupon = coupon
      }
    }

    if (bestCoupon) {
      res.json({
        success: true,
        message: "Best coupon applied!",
        code: bestCoupon.code,
        discountType: bestCoupon.discountType,
        discountValue: bestCoupon.discountValue,
        calculatedDiscount: maxDiscount
      })
    } else {
      res.json({ success: false, message: "No eligible coupons found" })
    }
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

module.exports = {
  createCoupon,
  listCoupons,
  deleteCoupon,
  validateCoupon,
  autoApplyCoupon,
  checkCouponValidity // Exported for unit testing
}
