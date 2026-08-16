const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "customer",
    enum: ["customer", "restaurant", "admin", "rider"]
  },
  loyaltyPoints: { type: Number, default: 0 },
  pushSubscriptions: { type: Array, default: [] },
  restaurantName: {
    type: String
  },
  restaurantAddress: {
    type: String
  },
  vehicleType: {
    type: String,
    enum: ["bike", "scooter", "ev"],
    default: "bike" // Only applicable if role is 'rider'
  },
  kitchenLoad: {
    type: String,
    enum: ["Normal", "Busy", "Overwhelmed"],
    default: "Normal" // Only applicable if role is 'restaurant'
  },
  isPrimeMember: {
    type: Boolean,
    default: false
  },
  primeExpiryDate: {
    type: Date
  },
  stripeCustomerId: {
    type: String
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String
  },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastOrderDate: { type: Date, default: null }
})

module.exports = mongoose.model("User", userSchema)
