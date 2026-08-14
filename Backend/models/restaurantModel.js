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
  ]
})

const restaurantModel = mongoose.models.restaurant || mongoose.model("restaurant", restaurantSchema)

module.exports = restaurantModel
