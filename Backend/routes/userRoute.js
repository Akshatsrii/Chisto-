const express = require("express")
const rateLimit = require("express-rate-limit")
const { registerUser, loginUser } = require("../controllers/userController")

const userRouter = express.Router()

// Strict Limiter for Auth Routes
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { success: false, message: "Too many login attempts from this IP, please try again after 1 minute." }
})

userRouter.post("/register", registerUser)
userRouter.post("/login", authLimiter, loginUser)

module.exports = userRouter
