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
reviewRouter.get("/food/:foodId", listReviews)
reviewRouter.post("/moderate", authMiddleware, moderateReview)

module.exports = reviewRouter
