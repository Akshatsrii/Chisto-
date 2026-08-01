const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const foodModel = require("./models/foodModel");
const userModel = require("./models/userModel");

const food_list = [
    {
        name: "Green salad",
        image: "food_1.png",
        price: 12,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Salad"
    },
    {
        name: "Veg salad",
        image: "food_2.png",
        price: 18,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Salad"
    },
    {
        name: "Clover Salad",
        image: "food_3.png",
        price: 16,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Salad"
    },
    {
        name: "Chicken Salad",
        image: "food_4.png",
        price: 24,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Salad"
    },
    {
        name: "Lasagna Rolls",
        image: "food_5.png",
        price: 14,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Rolls"
    },
    {
        name: "Peri Peri Rolls",
        image: "food_6.png",
        price: 12,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Rolls"
    },
    {
        name: "Chicken Rolls",
        image: "food_7.png",
        price: 20,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Rolls"
    },
    {
        name: "Veg Rolls",
        image: "food_8.png",
        price: 15,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Rolls"
    },
    {
        name: "Ripple Ice Cream",
        image: "food_9.png",
        price: 14,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Deserts"
    },
    {
        name: "Fruit Ice Cream",
        image: "food_10.png",
        price: 22,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Deserts"
    },
    {
        name: "Jar Ice Cream",
        image: "food_11.png",
        price: 10,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Deserts"
    },
    {
        name: "Vanilla Ice Cream",
        image: "food_12.png",
        price: 12,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Deserts"
    },
    {
        name: "Chicken Sandwich",
        image: "food_13.png",
        price: 12,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Sandwich"
    },
    {
        name: "Vegan Sandwich",
        image: "food_14.png",
        price: 18,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Sandwich"
    },
    {
        name: "Grilled Sandwich",
        image: "food_15.png",
        price: 16,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Sandwich"
    },
    {
        name: "Bread Sandwich",
        image: "food_16.png",
        price: 24,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Sandwich"
    },
    {
        name: "Cup Cake",
        image: "food_17.png",
        price: 14,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Cake"
    },
    {
        name: "Vegan Cake",
        image: "food_18.png",
        price: 12,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Cake"
    },
    {
        name: "Butterscotch Cake",
        image: "food_19.png",
        price: 20,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Cake"
    },
    {
        name: "Sliced Cake",
        image: "food_20.png",
        price: 15,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Cake"
    },
    {
        name: "Garlic Mushroom ",
        image: "food_21.png",
        price: 14,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Pure Veg"
    },
    {
        name: "Fried Cauliflower",
        image: "food_22.png",
        price: 22,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Pure Veg"
    },
    {
        name: "Mix Veg Pulao",
        image: "food_23.png",
        price: 10,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Pure Veg"
    },
    {
        name: "Rice Zucchini",
        image: "food_24.png",
        price: 12,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Pure Veg"
    },
    {
        name: "Cheese Pasta",
        image: "food_25.png",
        price: 12,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Pasta"
    },
    {
        name: "Chisto Pasta",
        image: "food_26.png",
        price: 18,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Pasta"
    },
    {
        name: "Creamy Pasta",
        image: "food_27.png",
        price: 16,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Pasta"
    },
    {
        name: "Chicken Pasta",
        image: "food_28.png",
        price: 24,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Pasta"
    },
    {
        name: "Buttter Noodles",
        image: "food_29.png",
        price: 14,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Noodles"
    },
    {
        name: "Veg Noodles",
        image: "food_30.png",
        price: 12,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Noodles"
    },
    {
        name: "Somen Noodles",
        image: "food_31.png",
        price: 20,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Noodles"
    },
    {
        name: "Cooked Noodles",
        image: "food_32.png",
        price: 15,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Noodles"
    }
];

const populateFoods = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const adminUser = await userModel.findOne({ email: "admin@chisto.com" });
        if (!adminUser) {
            console.log("No admin user found! Please run populate_restaurants.js first.");
            process.exit(1);
        }

        const uploadsDir = path.join(__dirname, "uploads");
        const files = fs.readdirSync(uploadsDir);

        for (const food of food_list) {
            // Find the image file in uploads that ends with food.image
            const imageFile = files.find(f => f.endsWith("-" + food.image) || f.endsWith("_" + food.image) || f === food.image);
            
            if (imageFile) {
                const existing = await foodModel.findOne({ name: food.name });
                if (!existing) {
                    await foodModel.create({
                        name: food.name,
                        description: food.description,
                        price: food.price,
                        category: food.category,
                        image: imageFile,
                        restaurantId: adminUser._id,
                        restaurantName: adminUser.restaurantName
                    });
                    console.log(`Created food: ${food.name}`);
                } else {
                    console.log(`Food already exists: ${food.name}`);
                }
            } else {
                console.log(`Could not find image for food: ${food.name}`);
            }
        }
        console.log("Foods populated successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

populateFoods();
