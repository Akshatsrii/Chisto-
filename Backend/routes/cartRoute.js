const express = require("express")

const {
  addToCart,
  removeFromCart,
  getCart
} = require("../controllers/cartController")

const authMiddleware = require("../middleware/auth")

const cartRouter = express.Router()

/**
 * @swagger
 * /api/cart/get:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
cartRouter.get("/get", authMiddleware, getCart)

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Added to cart
 */
cartRouter.post("/add", authMiddleware, addToCart)

cartRouter.post("/remove", authMiddleware, removeFromCart)

module.exports = cartRouter
