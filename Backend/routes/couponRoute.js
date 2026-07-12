const express = require("express")
const {
  createCoupon,
  listCoupons,
  deleteCoupon,
  validateCoupon
} = require("../controllers/couponController")
const authMiddleware = require("../middleware/auth")

const couponRouter = express.Router()

couponRouter.post("/create", authMiddleware, createCoupon)
couponRouter.get("/list", authMiddleware, listCoupons)
couponRouter.delete("/delete/:id", authMiddleware, deleteCoupon)
couponRouter.post("/apply", authMiddleware, validateCoupon)

module.exports = couponRouter
