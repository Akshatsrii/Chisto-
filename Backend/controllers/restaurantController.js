const restaurantModel = require("../models/restaurantModel")

// Get availability and settings for a specific restaurant
const getAvailability = async (req, res) => {
  try {
    const { restaurantName } = req.params
    const restaurant = await restaurantModel.findOne({ restaurantName })
    
    if (restaurant) {
      res.json({ success: true, data: restaurant })
    } else {
      res.json({ success: true, data: { unavailableDates: [], latitude: 28.6139, longitude: 77.2090, maxDeliveryRadius: 5 } }) // Default
    }
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching settings" })
  }
}

// Get availability and settings for multiple restaurants (used during checkout)
const getMultipleAvailability = async (req, res) => {
  try {
    const { restaurantNames } = req.body // Array of names
    const restaurants = await restaurantModel.find({
      restaurantName: { $in: restaurantNames }
    })
    
    // Map restaurant name to their full data
    const restaurantMap = {}
    restaurants.forEach(r => {
      restaurantMap[r.restaurantName] = r
    })

    res.json({ success: true, data: restaurantMap })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching restaurant settings" })
  }
}

// Update availability and settings (Admin only)
const updateAvailability = async (req, res) => {
  try {
    const { restaurantName, unavailableDates, latitude, longitude, maxDeliveryRadius } = req.body
    
    let restaurant = await restaurantModel.findOne({ restaurantName })
    
    if (restaurant) {
      if (unavailableDates !== undefined) restaurant.unavailableDates = unavailableDates
      if (latitude !== undefined) restaurant.latitude = latitude
      if (longitude !== undefined) restaurant.longitude = longitude
      if (maxDeliveryRadius !== undefined) restaurant.maxDeliveryRadius = maxDeliveryRadius
      await restaurant.save()
    } else {
      restaurant = new restaurantModel({
        restaurantName,
        unavailableDates: unavailableDates || [],
        latitude: latitude || 28.6139,
        longitude: longitude || 77.2090,
        maxDeliveryRadius: maxDeliveryRadius || 5
      })
      await restaurant.save()
    }
    
    res.json({ success: true, message: "Restaurant settings updated successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error updating settings" })
  }
}

module.exports = { getAvailability, getMultipleAvailability, updateAvailability }
