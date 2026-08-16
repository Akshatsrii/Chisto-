const express = require("express")
const multer = require("multer")
const { addFood, listFood, removeFood, addReview, updateStock } = require("../controllers/foodController")
const authMiddleware = require("../middleware/auth")

const foodRouter = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  }
})

const upload = multer({ storage })

/**
 * @swagger
 * /api/food/add:
 *   post:
 *     summary: Add a new food item (Admin/Restaurant)
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               dietaryPreference:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Food added successfully
 */
foodRouter.post("/add", authMiddleware, upload.single("image"), addFood)

/**
 * @swagger
 * /api/food/list:
 *   get:
 *     summary: Get all food items
 *     tags: [Food]
 *     responses:
 *       200:
 *         description: List of all foods
 */
foodRouter.get("/list", listFood)

/**
 * @swagger
 * /api/food/remove/{id}:
 *   delete:
 *     summary: Remove a food item (Admin/Restaurant)
 *     tags: [Food]
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
 *         description: Food removed successfully
 */
foodRouter.delete("/remove/:id", authMiddleware, removeFood)

/**
 * @swagger
 * /api/food/update-stock/{id}:
 *   post:
 *     summary: Update stock status of a food item (Restaurant)
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inStock:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Stock updated
 */
foodRouter.post("/update-stock/:id", authMiddleware, updateStock)

/**
 * @swagger
 * /api/food/review/{id}:
 *   post:
 *     summary: Add a review for a food item
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review added
 */
foodRouter.post("/review/:id", authMiddleware, addReview)

module.exports = foodRouter
