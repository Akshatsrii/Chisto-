const { checkCouponValidity } = require("../controllers/couponController")
// We will mock orderModel for the isFirstOrderOnly check
const orderModel = require("../models/orderModel")

jest.mock("../models/orderModel")

describe("Coupon Validation Logic (Unit Tests)", () => {
  const mockUser = {
    _id: "user123",
    email: "test@chisto.com"
  }

  const baseCoupon = {
    code: "TEST10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 200,
    expiryDate: new Date(Date.now() + 86400000), // tomorrow
    usageLimit: 100,
    usedCount: 0,
    userSpecific: "",
    isFirstOrderOnly: false,
    categorySpecific: ""
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return valid and calculate correct percentage discount", async () => {
    const result = await checkCouponValidity(baseCoupon, mockUser, 500, [])
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(50) // 10% of 500
  })

  it("should return valid and calculate correct fixed discount", async () => {
    const fixedCoupon = { ...baseCoupon, discountType: "fixed", discountValue: 150 }
    const result = await checkCouponValidity(fixedCoupon, mockUser, 500, [])
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(150)
  })

  it("should fail if order amount is less than minOrderAmount", async () => {
    const result = await checkCouponValidity(baseCoupon, mockUser, 150, [])
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/Minimum order amount/)
  })

  it("should fail if coupon is expired", async () => {
    const expiredCoupon = { ...baseCoupon, expiryDate: new Date(Date.now() - 86400000) } // yesterday
    const result = await checkCouponValidity(expiredCoupon, mockUser, 500, [])
    expect(result.valid).toBe(false)
    expect(result.message).toBe("Coupon has expired")
  })

  it("should fail if usage limit is reached", async () => {
    const limitedCoupon = { ...baseCoupon, usedCount: 100, usageLimit: 100 }
    const result = await checkCouponValidity(limitedCoupon, mockUser, 500, [])
    expect(result.valid).toBe(false)
    expect(result.message).toBe("Coupon usage limit reached")
  })

  it("should fail if user specific coupon doesn't match email", async () => {
    const specificCoupon = { ...baseCoupon, userSpecific: "other@chisto.com" }
    const result = await checkCouponValidity(specificCoupon, mockUser, 500, [])
    expect(result.valid).toBe(false)
    expect(result.message).toBe("This coupon is not valid for your account")
  })

  it("should fail if first order only but user has previous orders", async () => {
    const firstOrderCoupon = { ...baseCoupon, isFirstOrderOnly: true }
    orderModel.countDocuments.mockResolvedValueOnce(1) // Simulate 1 past order
    const result = await checkCouponValidity(firstOrderCoupon, mockUser, 500, [])
    expect(result.valid).toBe(false)
    expect(result.message).toBe("This coupon is valid for first-time orders only")
  })

  it("should fail if category specific condition is not met by cart items", async () => {
    const categoryCoupon = { ...baseCoupon, categorySpecific: "Pizza" }
    const cartItems = [
      { name: "Burger", category: "Fast Food" }
    ]
    const result = await checkCouponValidity(categoryCoupon, mockUser, 500, cartItems)
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/requires at least one item from the 'Pizza' category/)
  })

  it("should pass if category specific condition is met", async () => {
    const categoryCoupon = { ...baseCoupon, categorySpecific: "Pizza" }
    const cartItems = [
      { name: "Margherita", category: "Pizza" },
      { name: "Coke", category: "Drinks" }
    ]
    const result = await checkCouponValidity(categoryCoupon, mockUser, 500, cartItems)
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(50)
  })
})
