const foodModel = require("../models/foodModel")
const userModel = require("../models/userModel")

// ➕ ADD FOOD
const addFood = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({
        success: false,
        message: "Name is missing"
      })
    }

    const user = await userModel.findById(req.userId)
    if (!user || (user.role !== "restaurant" && user.role !== "admin")) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to add food items"
      })
    }

    const food = new foodModel({
      name: req.body.name.trim(),
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      dietaryPreference: req.body.dietaryPreference || "Unspecified",
      dietaryTags: req.body.dietaryTags ? JSON.parse(req.body.dietaryTags) : [],
      allergens: req.body.allergens ? JSON.parse(req.body.allergens) : [],
      image: req.file.filename,
      restaurantId: user._id,
      restaurantName: user.restaurantName || user.name
    })

    await food.save()

    res.status(201).json({
      success: true,
      message: "Food Added Successfully"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// 📋 LIST FOOD
const listFood = async (req, res) => {
  try {
    const filter = {}
    if (req.query.restaurantId) {
      filter.restaurantId = req.query.restaurantId
    }
    const foods = await foodModel.find(filter)
    res.status(200).json({
      success: true,
      data: foods
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ❌ REMOVE FOOD
const removeFood = async (req, res) => {
  try {
    const { id } = req.params

    // Check if the user is authorized to delete this food
    const food = await foodModel.findById(id)
    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found" })
    }

    const user = await userModel.findById(req.userId)
    if (!user || (user.role !== "admin" && String(food.restaurantId) !== String(user._id))) {
      return res.status(403).json({ success: false, message: "Unauthorized to remove this food item" })
    }

    await foodModel.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: "Food Removed Successfully"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ⭐ ADD REVIEW
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body
    const { id } = req.params

    if (!rating) {
      return res.json({ success: false, message: "Rating is required" })
    }

    const user = await userModel.findById(req.userId)
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }

    const food = await foodModel.findById(id)
    if (!food) {
      return res.json({ success: false, message: "Food item not found" })
    }

    const review = {
      userId: req.userId,
      userName: user.name,
      rating: Number(rating),
      comment: comment || "",
      date: new Date()
    }

    food.reviews.push(review)

    // Recalculate average rating
    const total = food.reviews.reduce((acc, r) => acc + r.rating, 0)
    food.averageRating = Number((total / food.reviews.length).toFixed(1))

    await food.save()

    res.status(200).json({
      success: true,
      message: "Review Added Successfully",
      data: food
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// 🔄 UPDATE STOCK (Phase 15d)
const updateStock = async (req, res) => {
  try {
    const { id } = req.params
    const { inStock } = req.body

    const food = await foodModel.findById(id)
    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found" })
    }

    const user = await userModel.findById(req.userId)
    if (!user || (user.role !== "admin" && String(food.restaurantId) !== String(user._id))) {
      return res.status(403).json({ success: false, message: "Unauthorized" })
    }

    food.inStock = inStock
    await food.save()

    // Emit Socket.IO event for real-time frontend update
    const io = req.app.get("io")
    if (io) {
      io.emit("food_stock_updated", { foodId: id, inStock })
    }

    res.status(200).json({ success: true, message: "Stock updated successfully", data: food })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { addFood, listFood, removeFood, addReview, updateStock }
