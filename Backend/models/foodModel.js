const mongoose = require("mongoose")

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  dietaryPreference: {
    type: String,
    enum: ["Veg", "Non-Veg", "Vegan", "Unspecified"],
    default: "Unspecified"
  },
  dietaryTags: {
    type: [String],
    default: []
  },
  allergens: {
    type: [String],
    default: []
  },
  inStock: {
    type: Boolean,
    default: true
  },
  restaurantId: {
    type: String,
    default: "admin"
  },
  restaurantName: {
    type: String,
    default: "Chisto Kitchen"
  },
  reviews: [
    {
      userId: String,
      userName: String,
      rating: Number,
      comment: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  averageRating: {
    type: Number,
    default: 4.5
  }
})

const foodModel =
  mongoose.models.food || mongoose.model("food", foodSchema)

module.exports = foodModel
