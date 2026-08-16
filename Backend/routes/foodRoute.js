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

// ➕ ADD
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

// ❌ REMOVE
foodRouter.delete("/remove/:id", authMiddleware, removeFood)

// 🔄 UPDATE STOCK
foodRouter.post("/update-stock/:id", authMiddleware, updateStock)

// ⭐ REVIEW
foodRouter.post("/review/:id", authMiddleware, addReview)

module.exports = foodRouter
