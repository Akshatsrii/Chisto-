const orderModel = require("../models/orderModel")
const userModel = require("../models/userModel")
const couponModel = require("../models/couponModel")
const Stripe = require("stripe")
const webpush = require("web-push")

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contact@chisto.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
} else {
  console.warn("VAPID keys not found. Push notifications will be disabled.")
}

// Helper to send push notification
const sendOrderPushNotification = async (userId, title, body) => {
  try {
    const user = await userModel.findById(userId)
    if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const payload = JSON.stringify({ title, body })
      
      const promises = user.pushSubscriptions.map(sub => 
        webpush.sendNotification(sub, payload).catch(err => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Subscription has expired or is no longer valid: ', err)
          }
        })
      )
      await Promise.all(promises)
    }
  } catch (error) {
    console.error("Error sending push notification", error)
  }
}

// Helper to update user streak
const updateStreak = async (userId) => {
  try {
    const user = await userModel.findById(userId)
    if (!user) return

    const today = new Date()
    const lastOrder = user.lastOrderDate ? new Date(user.lastOrderDate) : null
    
    if (!lastOrder) {
      user.currentStreak = 1
      user.longestStreak = 1
    } else {
      const diffTime = Math.abs(today - lastOrder)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 7) {
        // Ordered within the same week, increment streak
        user.currentStreak += 1
        if (user.currentStreak > user.longestStreak) {
          user.longestStreak = user.currentStreak
        }

        // Award loyalty points every 5th streak (e.g. 5, 10, 15)
        if (user.currentStreak % 5 === 0) {
          user.loyaltyPoints += 100 // Bonus 100 points
          await sendOrderPushNotification(userId, "🔥 Streak Bonus!", `You hit a ${user.currentStreak} week streak! +100 Loyalty Points!`)
        }
      } else {
        // Streak broken
        user.currentStreak = 1
      }
    }
    
    user.lastOrderDate = today
    await user.save()
  } catch(err) {
    console.error("Error updating streak", err)
  }
}

const mongoose = require("mongoose")

// ==============================
// PLACE ORDER (COD + STRIPE)
// ==============================
const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173"

  try {
    const userId = req.userId
    const { items, amount, address, paymentMethod, isScheduled, scheduledDate, travelDetails, couponCode, discountAmount, distance, surgeFee, weatherCondition } = req.body

    if (!items || !amount || !address) {
      return res.json({ success: false, message: "Missing order details" })
    }

    const user = await userModel.findById(userId)

    // Delivery Fee Logic (Waived for Prime members)
    let deliveryFee = 40
    if (user && user.isPrimeMember) {
      deliveryFee = 0
    }

    // Process coupon stats if a coupon was used
    if (couponCode && discountAmount) {
      await couponModel.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { 
          $inc: { 
            usedCount: 1, 
            totalDiscountGiven: discountAmount 
          } 
        }
      )
    }

    // Group items by restaurant
    const restaurantGroups = {}
    items.forEach(item => {
      const rId = item.restaurantId || "admin"
      if (!restaurantGroups[rId]) {
        restaurantGroups[rId] = { items: [], subtotal: 0, restaurantName: item.restaurantName || "Chisto Kitchen" }
      }
      restaurantGroups[rId].items.push(item)
      restaurantGroups[rId].subtotal += (item.price * item.quantity)
    })

    const numRestaurants = Object.keys(restaurantGroups).length
    const deliveryFeePerRest = Math.round(deliveryFee / numRestaurants)
    const surgeFeePerRest = Math.round((surgeFee || 0) / numRestaurants)
    const groupId = new mongoose.Types.ObjectId().toString()
    const newOrders = []

    for (const rId of Object.keys(restaurantGroups)) {
      const group = restaurantGroups[rId]
      const orderAmount = group.subtotal + deliveryFeePerRest + surgeFeePerRest
      
      const newOrder = new orderModel({
        userId,
        groupId,
        restaurantId: rId,
        items: group.items,
        amount: orderAmount,
        address,
        payment: false,
        isScheduled: isScheduled || false,
        scheduledDate: isScheduled ? new Date(scheduledDate) : null,
        travelDetails: isScheduled ? travelDetails : null,
        distance: distance || 5, // fallback 5km
        status: isScheduled ? "Scheduled (Awaiting Date)" : "Food Processing",
        surgeFee: surgeFeePerRest,
        weatherCondition: weatherCondition || "Clear"
      })
      newOrders.push(newOrder)
    }

    // ======================
    // 🟢 CASH ON DELIVERY
    // ======================
    if (paymentMethod === "COD") {
      await orderModel.insertMany(newOrders)

      // award loyalty points (₹100 spent = 10 points)
      const pointsEarned = Math.floor(amount / 100) * 10
      await userModel.findByIdAndUpdate(userId, { 
        cartData: {},
        $inc: { loyaltyPoints: pointsEarned }
      })

      return res.json({
        success: true,
        message: "Order confirmed (Cash on Delivery)"
      })
    }

    // ======================
    // 🔵 ONLINE PAYMENT (STRIPE)
    // ======================
    if (paymentMethod === "ONLINE") {
      // For online payment, set status
      newOrders.forEach(o => o.status = "Payment Verification Pending")
      await orderModel.insertMany(newOrders)

      const line_items = items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name
          },
          unit_amount: item.price * 100
        },
        quantity: item.quantity
      }))

      // delivery charges
      if (deliveryFee > 0) {
        line_items.push({
          price_data: {
            currency: "inr",
            product_data: {
              name: "Delivery Charges"
            },
            unit_amount: deliveryFee * 100
          },
          quantity: 1
        })
      }
      
      // surge fee if any
      if (surgeFee > 0) {
        line_items.push({
          price_data: {
            currency: "inr",
            product_data: { name: "Surge Fee" },
            unit_amount: surgeFee * 100
          },
          quantity: 1
        })
      }

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        // Pass groupId as orderId so verifyOrder marks all sub-orders as paid
        success_url: `${frontend_url}/verify?success=true&orderId=${groupId}`,
        cancel_url: `${frontend_url}/verify?success=false&orderId=${groupId}`
      })

      return res.json({
        success: true,
        session_url: session.url
      })
    }

    res.json({ success: false, message: "Invalid payment method" })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ==============================
// VERIFY PAYMENT (STRIPE CALLBACK)
// ==============================
const verifyOrder = async (req, res) => {
  try {
    const { success, orderId } = req.body

    if (success === "true") {
      // First check if it's a groupId
      let orders = await orderModel.find({ groupId: orderId })
      
      let totalAmount = 0
      
      if (orders && orders.length > 0) {
        // It's a grouped order
        await orderModel.updateMany({ groupId: orderId }, {
          payment: true,
          status: "Payment Verification Pending"
        })
        totalAmount = orders.reduce((sum, o) => sum + o.amount, 0)
      } else {
        // Fallback to single order ID
        const order = await orderModel.findByIdAndUpdate(orderId, { 
          payment: true,
          status: "Payment Verification Pending"
        })
        if (order) totalAmount = order.amount
      }

      const pointsEarned = Math.floor(totalAmount / 100) * 10
      await userModel.findByIdAndUpdate(req.userId, { 
        cartData: {},
        $inc: { loyaltyPoints: pointsEarned }
      })

      res.json({ success: true, message: "Payment Successful" })
    } else {
      // Delete orders if failed
      const deletedGroup = await orderModel.deleteMany({ groupId: orderId })
      if (deletedGroup.deletedCount === 0) {
        await orderModel.findByIdAndDelete(orderId)
      }
      res.json({ success: false, message: "Payment Failed" })
    }
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ==============================
// USER ORDERS
// ==============================
const userOrders = async (req, res) => {
  try {
    const userId = req.userId
    const orders = await orderModel.find({ userId })

    res.json({ success: true, data: orders })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error" })
  }
}

// ==============================
// LIST ALL ORDERS (ADMIN & RESTAURANT)
// ==============================
const listOrders = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId)
    if (!user || (user.role !== "admin" && user.role !== "restaurant")) {
      return res.status(403).json({ success: false, message: "Unauthorized access" })
    }

    const orders = await orderModel.find({}).sort({ date: -1 })

    if (user.role === "restaurant") {
      const filteredOrders = orders.filter(order =>
        order.items.some(item => String(item.restaurantId) === String(user._id))
      ).map(order => {
        const orderCopy = order.toObject()
        orderCopy.items = order.items.filter(item => String(item.restaurantId) === String(user._id))
        return orderCopy
      })
      return res.json({ success: true, data: filteredOrders })
    }

    res.json({ success: true, data: orders })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==============================
// UPDATE ORDER STATUS (ADMIN & RESTAURANT)
// ==============================
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body

    if (!orderId || !status) {
      return res.json({
        success: false,
        message: "Order ID and status are required"
      })
    }

    const user = await userModel.findById(req.userId)
    if (!user || (user.role !== "admin" && user.role !== "restaurant")) {
      return res.status(403).json({ success: false, message: "Unauthorized access" })
    }

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    )

    // Broadcast the updated status to the client in real-time
    const io = req.app.get("io")
    if (io) {
      io.to(orderId).emit("order_status_update", { orderId, status })
      console.log(`Socket Broadcast: Order ${orderId} status changed to: ${status}`)
    }

    // Send push notification
    if (order) {
      await sendOrderPushNotification(order.userId, "Order Update 🍔", `Your order status is now: ${status}`)
      if (status === "Delivered") {
        await updateStreak(order.userId)
      }
    }

    res.json({
      success: true,
      message: "Status Updated"
    })

  } catch (error) {
    console.log(error)
    res.json({
      success: false,
      message: "Error"
    })
  }
}

// ==============================
// ==============================
// RIDER: LIST UNASSIGNED ORDERS
// ==============================
const listUnassignedOrders = async (req, res) => {
  try {
    // Only show orders that are not assigned and are confirmed/cooking/prep
    const orders = await orderModel.find({ riderId: "" })
    res.json({ success: true, data: orders })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ==============================
// RIDER: LIST ASSIGNED ORDERS
// ==============================
const listAssignedOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ riderId: req.userId })
    res.json({ success: true, data: orders })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ==============================
// RIDER: ACCEPT ORDER
// ==============================
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.body
    const rider = await userModel.findById(req.userId)
    if (!rider || rider.role !== "rider") {
      return res.json({ success: false, message: "Only riders can accept orders" })
    }

    const orderToAccept = await orderModel.findById(orderId)
    if (!orderToAccept) return res.json({ success: false, message: "Order not found" })

    // Calculate CO2 Stats
    const vehicleType = rider.vehicleType || "bike"
    let emissionFactor = 110 // default bike
    if (vehicleType === "ev") emissionFactor = 0
    else if (vehicleType === "scooter") emissionFactor = 80
    
    const baselineCarEmission = 250 // grams per km
    const distance = orderToAccept.distance || 5 // fallback 5km
    
    const co2Emissions = distance * emissionFactor
    const co2Saved = distance * (baselineCarEmission - emissionFactor)

    const order = await orderModel.findByIdAndUpdate(orderId, {
      riderId: req.userId,
      riderName: rider.name,
      vehicleType: vehicleType,
      co2Emissions: co2Emissions,
      co2Saved: co2Saved
    }, { new: true })

    // Broadcast status update
    const io = req.app.get("io")
    if (io) {
      io.to(orderId).emit("order_status_update", { orderId, status: order.status })
    }

    res.json({ success: true, message: "Order Accepted", data: order })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ==============================
// RESTAURANT: ASSIGN ORDER TO RIDER
// ==============================
const assignRiderToOrder = async (req, res) => {
  try {
    const { orderId, riderId } = req.body
    
    // Admin or Restaurant only
    const user = await userModel.findById(req.userId)
    if (!user || (user.role !== "admin" && user.role !== "restaurant")) {
      return res.status(403).json({ success: false, message: "Unauthorized" })
    }

    const rider = await userModel.findById(riderId)
    if (!rider || rider.role !== "rider") {
      return res.json({ success: false, message: "Invalid rider selected" })
    }

    const orderToAccept = await orderModel.findById(orderId)
    if (!orderToAccept) return res.json({ success: false, message: "Order not found" })

    // Calculate CO2 Stats
    const vehicleType = rider.vehicleType || "bike"
    let emissionFactor = 110 // default bike
    if (vehicleType === "ev") emissionFactor = 0
    else if (vehicleType === "scooter") emissionFactor = 80
    
    const baselineCarEmission = 250 // grams per km
    const distance = orderToAccept.distance || 5 // fallback 5km
    
    const co2Emissions = distance * emissionFactor
    const co2Saved = distance * (baselineCarEmission - emissionFactor)

    const order = await orderModel.findByIdAndUpdate(orderId, {
      riderId: riderId,
      riderName: rider.name,
      vehicleType: vehicleType,
      co2Emissions: co2Emissions,
      co2Saved: co2Saved,
      status: "Out for Delivery"
    }, { new: true })

    // Broadcast status update to Customer
    const io = req.app.get("io")
    if (io) {
      io.to(orderId).emit("order_status_update", { orderId, status: order.status })
    }

    res.json({ success: true, message: "Order assigned to Rider successfully", data: order })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ==============================
// RIDER: UPDATE STATUS
// ==============================
const updateRiderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body
    
    const order = await orderModel.findById(orderId)
    if (!order) {
      return res.json({ success: false, message: "Order not found" })
    }
    if (String(order.riderId) !== String(req.userId)) {
      return res.json({ success: false, message: "Unauthorized. This order is not assigned to you." })
    }

    order.status = status
    await order.save()

    // Broadcast update
    const io = req.app.get("io")
    if (io) {
      io.to(orderId).emit("order_status_update", { orderId, status })
    }

    // Send push notification
    await sendOrderPushNotification(order.userId, "Delivery Update 🛵", `Your order status is now: ${status}`)
    if (status === "Delivered") {
      await updateStreak(order.userId)
    }

    res.json({ success: true, message: `Status updated to ${status}` })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ==============================
// RIDER: EARNINGS DASHBOARD
// ==============================
const getRiderEarnings = async (req, res) => {
  try {
    const orders = await orderModel.find({ riderId: req.userId, status: "Delivered" })
    const deliveryFeePerOrder = 50
    const totalEarnings = orders.length * deliveryFeePerOrder

    res.json({
      success: true,
      deliveredCount: orders.length,
      totalEarnings: totalEarnings,
      orders: orders
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ==============================
// EXPORTS
// ==============================
module.exports = {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  listUnassignedOrders,
  listAssignedOrders,
  acceptOrder,
  updateRiderStatus,
  getRiderEarnings,
  assignRiderToOrder
}
