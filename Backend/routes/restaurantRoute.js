const express = require("express")
const { getAvailability, getMultipleAvailability, updateAvailability } = require("../controllers/restaurantController")

const restaurantRouter = express.Router()

restaurantRouter.get("/availability/:restaurantName", getAvailability)
restaurantRouter.post("/availability/multiple", getMultipleAvailability)
restaurantRouter.post("/availability/update", updateAvailability)

module.exports = restaurantRouter
