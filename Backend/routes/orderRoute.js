const express = require("express")
const {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  listUnassignedOrders,
  listAssignedOrders,
  acceptOrder,
  updateRiderStatus,
  getRiderEarnings
} = require("../controllers/ordercontroller")

const authMiddleware = require("../middleware/auth")

const orderRouter = express.Router()

orderRouter.post("/place", authMiddleware, placeOrder)
orderRouter.post("/verify", authMiddleware, verifyOrder)
orderRouter.get("/user", authMiddleware, userOrders)
orderRouter.get("/list", authMiddleware, listOrders)
orderRouter.post("/status", authMiddleware, updateStatus)

// Rider API Endpoints
orderRouter.get("/unassigned", authMiddleware, listUnassignedOrders)
orderRouter.get("/assigned", authMiddleware, listAssignedOrders)
orderRouter.post("/accept", authMiddleware, acceptOrder)
orderRouter.post("/rider-status", authMiddleware, updateRiderStatus)
orderRouter.get("/earnings", authMiddleware, getRiderEarnings)

module.exports = orderRouter
