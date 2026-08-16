require("dotenv").config()
const mongoose = require("mongoose")
const restaurantModel = require("./models/restaurantModel")
const foodModel = require("./models/foodModel")

const seedDatabase = async () => {
  try {
    console.log("Connecting to Database...")
    await mongoose.connect(process.env.MONGO_URI)
    console.log("Connected!")

    console.log("Clearing old restaurants and foods...")
    await restaurantModel.deleteMany({})
    await foodModel.deleteMany({})
    
    const knownImages = [
      "1766837226657-food_1.png", "1766837995601-food_2.png", "1766838047915-food_3.png",
      "1766838095278-food_4.png", "1766838141537-food_5.png", "1766838176293-food_6.png",
      "1766838207938-food_7.png", "1766838252073-food_8.png", "1766838292897-food_9.png",
      "1766838322197-food_10.png"
    ]

    const categories = ["Salad", "Rolls", "Deserts", "Sandwich", "Cake", "Pure Veg", "Pasta", "Noodles"]
    
    console.log("Creating 50 Restaurants...")
    const restaurants = []
    for (let i = 1; i <= 50; i++) {
      restaurants.push({
        restaurantName: `Restaurant ${i} ${["Dhaba", "Bistro", "Cafe", "Eatery"][Math.floor(Math.random()*4)]}`,
        latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
        maxDeliveryRadius: 10
      })
    }
    
    const createdRestaurants = await restaurantModel.insertMany(restaurants)
    console.log(`Created ${createdRestaurants.length} restaurants.`)

    console.log("Creating 15 dishes for each restaurant...")
    const foods = []
    
    for (const restaurant of createdRestaurants) {
      for (let j = 1; j <= 15; j++) {
        const randImg = knownImages[Math.floor(Math.random() * knownImages.length)]
        const randCat = categories[Math.floor(Math.random() * categories.length)]
        const isSpecial = Math.random() > 0.8 // 20% chance to be special
        
        foods.push({
          name: `${randCat} Delight ${j} from ${restaurant.restaurantName}`,
          description: `Delicious ${randCat.toLowerCase()} prepared fresh at ${restaurant.restaurantName}.`,
          price: Math.floor(Math.random() * 400) + 100, // Price between 100 and 500
          image: randImg,
          category: randCat,
          restaurantId: restaurant._id,
          restaurantName: restaurant.restaurantName,
          averageRating: isSpecial ? (4.5 + Math.random() * 0.5).toFixed(1) : (3.0 + Math.random() * 1.5).toFixed(1) // Special gets 4.5+
        })
      }
    }
    
    const createdFoods = await foodModel.insertMany(foods)
    console.log(`Created ${createdFoods.length} dishes in total.`)
    
    console.log("Seeding Completed Successfully! 🎉")
    process.exit(0)
  } catch (error) {
    console.error("Error during seeding:", error)
    process.exit(1)
  }
}

seedDatabase()
