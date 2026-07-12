const express = require("express")
const {
  addReview,
  listReviews,
  moderateReview
} = require("../controllers/reviewController")
const authMiddleware = require("../middleware/auth")

const reviewRouter = express.Router()

reviewRouter.post("/add", authMiddleware, addReview)
reviewRouter.get("/food/:foodId", listReviews)
reviewRouter.post("/moderate", authMiddleware, moderateReview)

module.exports = reviewRouter
