const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  foodId: {
    type: String,
    required: true
  },
  foodName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  moderationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved" // Auto-approve by default, modifiable by admin
  },
  date: {
    type: Date,
    default: Date.now
  }
})

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema)
module.exports = reviewModel
