const reviewModel = require("../models/reviewModel")
const orderModel = require("../models/orderModel")
const userModel = require("../models/userModel")

const addReview = async (req, res) => {
  try {
    const { foodId, foodName, rating, comment } = req.body
    const userId = req.userId

    // 1. VERIFY PURCHASER CHECK
    const verifiedOrder = await orderModel.findOne({
      userId,
      status: "Delivered",
      "items._id": foodId
    })

    if (!verifiedOrder) {
      return res.json({
        success: false,
        message: "Only verified purchasers who have received this dish can write reviews 🔒"
      })
    }

    const user = await userModel.findById(userId)

    const newReview = new reviewModel({
      userId,
      userName: user.name,
      foodId,
      foodName,
      rating,
      comment,
      moderationStatus: "approved" // Auto-approve for demo
    })

    await newReview.save()
    res.json({ success: true, message: "Review posted successfully!" })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const listReviews = async (req, res) => {
  try {
    const { foodId } = req.params
    const reviews = await reviewModel.find({ foodId, moderationStatus: "approved" }).sort({ date: -1 })
    res.json({ success: true, data: reviews })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const moderateReview = async (req, res) => {
  try {
    const { reviewId, status } = req.body
    const user = await userModel.findById(req.userId)
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only administrators can moderate reviews" })
    }

    await reviewModel.findByIdAndUpdate(reviewId, { moderationStatus: status })
    res.json({ success: true, message: `Review status updated to: ${status}` })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

module.exports = {
  addReview,
  listReviews,
  moderateReview
}
