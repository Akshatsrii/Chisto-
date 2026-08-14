const mongoose = require("mongoose");
const orderModel = require("./models/orderModel");
require("dotenv").config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  try {
    const newOrder = new orderModel({
      userId: "661413bb6978df0dc87595ab", // Mock user ID that exists?
      items: [{name: "Pizza", price: 10, quantity: 1}],
      amount: 50,
      address: { street: "123 Test St", city: "Testville" },
      payment: false,
      isScheduled: false,
      scheduledDate: null,
      travelDetails: null,
      status: "Food Processing"
    });
    
    await newOrder.save();

    const pointsEarned = Math.floor(50 / 100) * 10;
    const userModel = require("./models/userModel");
    await userModel.findByIdAndUpdate("661413bb6978df0dc87595ab", { 
      cartData: {},
      $inc: { loyaltyPoints: pointsEarned }
    });
    console.log("Order saved successfully!");
  } catch (err) {
    console.error("Error saving order:", err.message);
  }
  process.exit();
}

test();
