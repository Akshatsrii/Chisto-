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

couponRouter.post("/create", authMiddleware, createCoupon)
couponRouter.get("/list", authMiddleware, listCoupons) // Note: this shouldn't strictly require admin if frontend users need to see them, or maybe it should. For now keeping it as is.
couponRouter.delete("/delete/:id", authMiddleware, deleteCoupon)
couponRouter.post("/apply", authMiddleware, validateCoupon)
couponRouter.post("/auto-apply", authMiddleware, autoApplyCoupon)

module.exports = couponRouter
