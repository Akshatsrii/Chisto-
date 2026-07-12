const express = require("express")
const multer = require("multer")
const { addFood, listFood, removeFood, addReview } = require("../controllers/foodController")
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

// 📋 LIST
foodRouter.get("/list", listFood)

// ❌ REMOVE
foodRouter.delete("/remove/:id", authMiddleware, removeFood)

// ⭐ REVIEW
foodRouter.post("/review/:id", authMiddleware, addReview)

module.exports = foodRouter
