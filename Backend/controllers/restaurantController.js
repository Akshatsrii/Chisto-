const restaurantModel = require("../models/restaurantModel")
const axios = require("axios") // Using axios for API call

// Helper to fetch weather surge
const fetchWeatherSurge = async (lat, lon) => {
  try {
    const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability&forecast_hours=2`)
    const probabilities = res.data?.hourly?.precipitation_probability || []
    const isRainForecasted = probabilities.some(prob => prob > 50)
    
    return {
      isRainForecasted,
      surgeFee: isRainForecasted ? 20 : 0
    }
  } catch (error) {
    console.log("Weather API error:", error.message)
    return { isRainForecasted: false, surgeFee: 0 }
  }
}

// Get availability and settings for a specific restaurant
const getAvailability = async (req, res) => {
  try {
    const { restaurantName } = req.params
    const restaurant = await restaurantModel.findOne({ restaurantName })
    
    if (restaurant) {
      const weather = await fetchWeatherSurge(restaurant.latitude, restaurant.longitude)
      res.json({ success: true, data: { ...restaurant.toObject(), ...weather } })
    } else {
      const weather = await fetchWeatherSurge(28.6139, 77.2090)
      res.json({ success: true, data: { unavailableDates: [], latitude: 28.6139, longitude: 77.2090, maxDeliveryRadius: 5, ...weather } }) // Default
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
    
    // We only need to check weather for the first restaurant since they are typically in the same city
    let globalWeather = { isRainForecasted: false, surgeFee: 0 }
    if (restaurants.length > 0) {
      globalWeather = await fetchWeatherSurge(restaurants[0].latitude, restaurants[0].longitude)
    }

    restaurants.forEach(r => {
      restaurantMap[r.restaurantName] = { ...r.toObject(), ...globalWeather }
    })

    res.json({ success: true, data: restaurantMap, weatherInfo: globalWeather })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching restaurant settings" })
  }
}

// Update availability and settings (Admin only)
const updateAvailability = async (req, res) => {
  try {
    const { restaurantName, unavailableDates, latitude, longitude, maxDeliveryRadius, kitchenLoad } = req.body
    
    let restaurant = await restaurantModel.findOne({ restaurantName })
    
    if (restaurant) {
      if (unavailableDates !== undefined) restaurant.unavailableDates = unavailableDates
      if (latitude !== undefined) restaurant.latitude = latitude
      if (longitude !== undefined) restaurant.longitude = longitude
      if (maxDeliveryRadius !== undefined) restaurant.maxDeliveryRadius = maxDeliveryRadius
      if (kitchenLoad !== undefined) restaurant.kitchenLoad = kitchenLoad
      await restaurant.save()
    } else {
      restaurant = new restaurantModel({
        restaurantName,
        unavailableDates: unavailableDates || [],
        latitude: latitude || 28.6139,
        longitude: longitude || 77.2090,
        maxDeliveryRadius: maxDeliveryRadius || 5,
        kitchenLoad: kitchenLoad || "Normal"
      })
      await restaurant.save()
    }
    
    // Broadcast kitchen load to connected clients via Socket.IO
    if (kitchenLoad !== undefined) {
      const io = req.app.get("io")
      if (io) {
        io.emit("kitchen_load_updated", { restaurantName, kitchenLoad })
      }
    }
    
    res.json({ success: true, message: "Restaurant settings updated successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error updating settings" })
  }
}

module.exports = { getAvailability, getMultipleAvailability, updateAvailability }
