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

/**
 * @swagger
 * /api/order/verify:
 *   post:
 *     summary: Verify payment
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
 *               success:
 *                 type: string
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified
 */
orderRouter.post("/verify", authMiddleware, verifyOrder)

/**
 * @swagger
 * /api/order/user:
 *   get:
 *     summary: Get user orders
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User orders
 */
orderRouter.get("/user", authMiddleware, userOrders)

/**
 * @swagger
 * /api/order/list:
 *   get:
 *     summary: List all orders (Admin/Restaurant)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders
 */
orderRouter.get("/list", authMiddleware, listOrders)

/**
 * @swagger
 * /api/order/status:
 *   post:
 *     summary: Update order status
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
 *               orderId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
orderRouter.post("/status", authMiddleware, updateStatus)

// Rider API Endpoints
orderRouter.get("/unassigned", authMiddleware, listUnassignedOrders)
orderRouter.get("/assigned", authMiddleware, listAssignedOrders)
orderRouter.post("/accept", authMiddleware, acceptOrder)
orderRouter.post("/rider-status", authMiddleware, updateRiderStatus)
orderRouter.get("/earnings", authMiddleware, getRiderEarnings)

module.exports = orderRouter
