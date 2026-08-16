const express = require("express")
const {
  addReview,
  listReviews,
  moderateReview
} = require("../controllers/reviewController")
const authMiddleware = require("../middleware/auth")

const reviewRouter = express.Router()

/**
 * @swagger
 * /api/review/add:
 *   post:
 *     summary: Add a food review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foodId:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review added
 */
reviewRouter.post("/add", authMiddleware, addReview)

/**
 * @swagger
 * /api/review/food/{foodId}:
 *   get:
 *     summary: Get reviews for a food item
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: foodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews
 */
reviewRouter.get("/food/:foodId", listReviews)

/**
 * @swagger
 * /api/review/moderate:
 *   post:
 *     summary: Moderate a review (Admin)
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review moderated
 */
reviewRouter.post("/moderate", authMiddleware, moderateReview)

module.exports = reviewRouter
