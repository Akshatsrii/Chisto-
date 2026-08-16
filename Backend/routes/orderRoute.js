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

/**
 * @swagger
 * /api/order/place:
 *   post:
 *     summary: Place a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               amount:
 *                 type: number
 *               address:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order placed
 */
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
