const request = require("supertest")
const app = require("../app")
const userModel = require("../models/userModel")
const orderModel = require("../models/orderModel")
const couponModel = require("../models/couponModel")
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: "http://mock-stripe-url.com" })
      }
    }
  }))
})

// Mock Mongoose Models
jest.mock("../models/userModel")
jest.mock("../models/orderModel")
jest.mock("../models/couponModel")

// Avoid connecting to real MongoDB or running cron jobs during test
jest.mock("../config/db", () => jest.fn())
jest.mock("../cronJobs", () => jest.fn())
jest.mock("socket.io", () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      emit: jest.fn()
    }))
  }
})

describe("API Integration Tests", () => {

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = "testsecret"
  })

  describe("POST /api/user/login", () => {
    it("should login user with correct credentials", async () => {
      userModel.findOne.mockResolvedValueOnce({
        _id: "user123",
        email: "test@chisto.com",
        password: "hashedpassword"
      })
      
      // Mock bcryptjs
      jest.spyOn(bcryptjs, "compare").mockResolvedValueOnce(true)
      
      const res = await request(app)
        .post("/api/user/login")
        .send({ email: "test@chisto.com", password: "password123" })
        
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.token).toBeDefined()
    })
    
    it("should fail login with incorrect password", async () => {
      userModel.findOne.mockResolvedValueOnce({
        _id: "user123",
        email: "test@chisto.com",
        password: "hashedpassword"
      })
      
      jest.spyOn(bcryptjs, "compare").mockResolvedValueOnce(false)
      
      const res = await request(app)
        .post("/api/user/login")
        .send({ email: "test@chisto.com", password: "wrongpassword" })
        
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe("Invalid credentials")
    })
  })

  describe("POST /api/coupon/apply", () => {
    it("should apply valid coupon and return discount", async () => {
      const mockToken = jwt.sign({ id: "user123" }, process.env.JWT_SECRET)
      
      userModel.findById.mockResolvedValueOnce({ _id: "user123", email: "test@chisto.com" })
      
      couponModel.findOne.mockResolvedValueOnce({
        code: "TEST50",
        discountType: "fixed",
        discountValue: 50,
        minOrderAmount: 200,
        expiryDate: new Date(Date.now() + 86400000), // valid
        usageLimit: 100,
        usedCount: 0
      })
      
      const res = await request(app)
        .post("/api/coupon/apply")
        .set("token", mockToken)
        .send({ code: "TEST50", amount: 500, cartItems: [] })
        
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.calculatedDiscount).toBe(50)
    })
  })
  
  describe("POST /api/order/place", () => {
    it("should place order successfully and return session_url", async () => {
      const mockToken = jwt.sign({ id: "user123" }, process.env.JWT_SECRET)
      
      userModel.findById.mockResolvedValueOnce({ _id: "user123", email: "test@chisto.com" })
      
      // Mock orderModel save
      const mockSave = jest.fn().mockResolvedValue(true)
      orderModel.mockImplementation(() => ({
        save: mockSave,
        _id: "order123"
      }))
      
      userModel.findByIdAndUpdate.mockResolvedValueOnce(true)
      
      const res = await request(app)
        .post("/api/order/place")
        .set("token", mockToken)
        .send({
          items: [{ _id: "food123", name: "Pizza", price: 200, quantity: 1 }],
          amount: 250,
          address: { street: "123 Main St", city: "Delhi", state: "DL", zipcode: "110001", country: "India" },
          distance: 5,
          paymentMethod: "ONLINE"
        })
        
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.session_url).toBe("http://mock-stripe-url.com")
    })
  })
})
