const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const userModel = require("./models/userModel")
const foodModel = require("./models/foodModel")

// Food list from assets.js to populate in database if database is empty,
// or we will just update existing food items in database.
const restaurantList = [
  { name: "Punjabi Dhaba", email: "punjabidhaba@chisto.com" },
  { name: "Bakers Delight", email: "bakersdelight@chisto.com" },
  { name: "Burger King", email: "burgerking@chisto.com" },
  { name: "Pizza Hut", email: "pizzahut@chisto.com" },
  { name: "South India Express", email: "southindia@chisto.com" },
  { name: "The Salad Bowl", email: "saladbowl@chisto.com" },
  { name: "The Pasta House", email: "pastahouse@chisto.com" },
  { name: "Noodle Station", email: "noodlestation@chisto.com" },
  { name: "Sweet Treats", email: "sweettreats@chisto.com" },
  { name: "Chisto Kitchen", email: "chistokitchen@chisto.com" }
]

const populate = async () => {
  try {
    console.log("Connecting to database...")
    await mongoose.connect(process.env.MONGO_URI)
    console.log("Connected successfully.")

    // 1. Create or verify restaurant partners and super admin
    const dbRestaurants = []
    const hashedPassword = await bcrypt.hash("password123", 10)

    // Seed Super Admin
    let superAdmin = await userModel.findOne({ email: "admin@chisto.com" })
    if (!superAdmin) {
      await userModel.create({
        name: "Super Admin",
        email: "admin@chisto.com",
        password: hashedPassword,
        role: "admin",
        restaurantName: "Chisto Head Office"
      })
      console.log("Created Super Admin: admin@chisto.com")
    } else {
      superAdmin.role = "admin"
      await superAdmin.save()
      console.log("Verified Super Admin: admin@chisto.com")
    }

    // Seed Rider Partner
    let riderPartner = await userModel.findOne({ email: "rider@chisto.com" })
    if (!riderPartner) {
      await userModel.create({
        name: "Chisto Rider Partner",
        email: "rider@chisto.com",
        password: hashedPassword,
        role: "rider"
      })
      console.log("Created Rider: rider@chisto.com")
    } else {
      riderPartner.role = "rider"
      await riderPartner.save()
      console.log("Verified Rider: rider@chisto.com")
    }

    for (const r of restaurantList) {
      let user = await userModel.findOne({ email: r.email })
      if (!user) {
        user = await userModel.create({
          name: r.name + " Partner",
          email: r.email,
          password: hashedPassword,
          role: "restaurant",
          restaurantName: r.name,
          restaurantAddress: "Chisto Food Street, Sector 1"
        })
        console.log(`Created Restaurant: ${r.name}`)
      } else {
        // Ensure role is restaurant
        user.role = "restaurant"
        user.restaurantName = r.name
        await user.save()
        console.log(`Verified Restaurant: ${r.name}`)
      }
      dbRestaurants.push(user)
    }

    // 2. Fetch all foods in database and distribute them across the 10 restaurants
    const foods = await foodModel.find({})
    if (foods.length === 0) {
      console.log("No food items found in database to distribute. Please add some food items first.")
    } else {
      console.log(`Distributing ${foods.length} food items across ${dbRestaurants.length} restaurants...`)
      for (let i = 0; i < foods.length; i++) {
        const food = foods[i]
        const restaurant = dbRestaurants[i % dbRestaurants.length]
        
        food.restaurantId = restaurant._id
        food.restaurantName = restaurant.restaurantName
        await food.save()
      }
      console.log("Distribution complete!")
    }

    // Seed Coupons
    const couponModel = require("./models/couponModel")
    let welcomeCoupon = await couponModel.findOne({ code: "WELCOME50" })
    if (!welcomeCoupon) {
      await couponModel.create({
        code: "WELCOME50",
        discountType: "fixed",
        discountValue: 50,
        minOrderAmount: 200,
        expiryDate: new Date("2030-12-31"),
        usageLimit: 100
      })
      console.log("Created Coupon: WELCOME50")
    }

    mongoose.connection.close()
    console.log("Database connection closed.")
  } catch (error) {
    console.error("Population error:", error)
    process.exit(1)
  }
}

populate()
