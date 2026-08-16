const express = require("express")
const {
  createCoupon,
  listCoupons,
  deleteCoupon,
  validateCoupon,
  autoApplyCoupon
} = require("../controllers/couponController")
const authMiddleware = require("../middleware/auth")

const couponRouter = express.Router()

/**
 * @swagger
 * /api/coupon/create:
 *   post:
 *     summary: Create a new coupon (Admin)
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountPercentage:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Coupon created
 */
couponRouter.post("/create", authMiddleware, createCoupon)

/**
 * @swagger
 * /api/coupon/list:
 *   get:
 *     summary: List all coupons
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons
 */
couponRouter.get("/list", authMiddleware, listCoupons)

/**
 * @swagger
 * /api/coupon/delete/{id}:
 *   delete:
 *     summary: Delete a coupon (Admin)
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deleted
 */
couponRouter.delete("/delete/:id", authMiddleware, deleteCoupon)
/**
 * @swagger
 * /api/coupon/apply:
 *   post:
 *     summary: Apply a coupon code
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               cartAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 */
couponRouter.post("/apply", authMiddleware, validateCoupon)
couponRouter.post("/auto-apply", authMiddleware, autoApplyCoupon)

module.exports = couponRouter
