const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  groupId: {
    type: String
  },
  restaurantId: {
    type: String
  },
  items: {
    type: Array,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  address: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    default: "Food Processing"
  },
  date: {
    type: Date,
    default: Date.now
  },
  payment: {
    type: Boolean,
    default: false
  },
  riderId: {
    type: String,
    default: ""
  },
  riderName: {
    type: String,
    default: ""
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  travelDetails: {
    type: Object, // { travelType: "Train" | "Flight", pnrOrFlightNumber: String }
    default: null
  },
  distance: {
    type: Number, // in km
    default: 0
  },
  vehicleType: {
    type: String,
    default: "bike"
  },
  co2Emissions: {
    type: Number, // in grams
    default: 0
  },
  co2Saved: {
    type: Number, // in grams
    default: 0
  },
  weatherCondition: {
    type: String, // "Clear", "Rain", etc.
    default: "Clear"
  },
  surgeFee: {
    type: Number,
    default: 0
  }
})

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema)

module.exports = orderModel
