const restaurantModel = require("../models/restaurantModel")

// Get availability for a specific restaurant
const getAvailability = async (req, res) => {
  try {
    const { restaurantName } = req.params
    const restaurant = await restaurantModel.findOne({ restaurantName })
    
    if (restaurant) {
      res.json({ success: true, data: restaurant.unavailableDates })
    } else {
      res.json({ success: true, data: [] }) // Default to fully available
    }
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching availability" })
  }
}

// Get availability for multiple restaurants (used during checkout)
const getMultipleAvailability = async (req, res) => {
  try {
    const { restaurantNames } = req.body // Array of names
    const restaurants = await restaurantModel.find({
      restaurantName: { $in: restaurantNames }
    })
    
    // Map restaurant name to their unavailable dates
    const availabilityMap = {}
    restaurants.forEach(r => {
      availabilityMap[r.restaurantName] = r.unavailableDates
    })

    res.json({ success: true, data: availabilityMap })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching availability" })
  }
}

// Update availability (Admin only)
const updateAvailability = async (req, res) => {
  try {
    const { restaurantName, unavailableDates } = req.body
    
    let restaurant = await restaurantModel.findOne({ restaurantName })
    
    if (restaurant) {
      restaurant.unavailableDates = unavailableDates
      await restaurant.save()
    } else {
      restaurant = new restaurantModel({
        restaurantName,
        unavailableDates
      })
      await restaurant.save()
    }
    
    res.json({ success: true, message: "Availability updated successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error updating availability" })
  }
}

module.exports = { getAvailability, getMultipleAvailability, updateAvailability }
