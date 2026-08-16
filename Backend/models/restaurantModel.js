const mongoose = require("mongoose")

const restaurantSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true,
    unique: true
  },
  unavailableDates: [
    {
      type: String // We will store dates as "YYYY-MM-DD" for simplicity
    }
  ],
  latitude: {
    type: Number,
    default: 28.6139 // Default to Delhi (can be configured by admin)
  },
  longitude: {
    type: Number,
    default: 77.2090
  },
  maxDeliveryRadius: {
    type: Number,
    default: 5 // Default 5 km
  },
  kitchenLoad: {
    type: String,
    enum: ["Normal", "Busy", "Overwhelmed"],
    default: "Normal"
  }
})

const restaurantModel = mongoose.models.restaurant || mongoose.model("restaurant", restaurantSchema)

module.exports = restaurantModel
