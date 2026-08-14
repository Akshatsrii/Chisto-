const orderModel = require("../models/orderModel")
const userModel = require("../models/userModel")
const Stripe = require("stripe")

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ==============================
// PLACE ORDER (COD + STRIPE)
// ==============================
const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173"

  try {
    const userId = req.userId
    const { items, amount, address, paymentMethod, isScheduled, scheduledDate, travelDetails } = req.body

    if (!items || !amount || !address) {
      return res.json({ success: false, message: "Missing order details" })
    }

    // ======================
    // 🟢 CASH ON DELIVERY
    // ======================
    if (paymentMethod === "COD") {
      const newOrder = new orderModel({
        userId,
        items,
        amount,
        address,
        payment: false,
        isScheduled: isScheduled || false,
        scheduledDate: isScheduled ? new Date(scheduledDate) : null,
        travelDetails: isScheduled ? travelDetails : null,
        status: isScheduled ? "Scheduled (Awaiting Date)" : "Food Processing"
      })

      await newOrder.save()

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
      const newOrder = new orderModel({
        userId,
        items,
        amount,
        address,
        payment: false,
        status: "Payment Verification Pending",
        isScheduled: isScheduled || false,
        scheduledDate: isScheduled ? new Date(scheduledDate) : null,
        travelDetails: isScheduled ? travelDetails : null
      })

      await newOrder.save()

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
      line_items.push({
        price_data: {
          currency: "inr",
          product_data: {
            name: "Delivery Charges"
          },
          unit_amount: 40 * 100
        },
        quantity: 1
      })

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
        cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`
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
      const order = await orderModel.findByIdAndUpdate(orderId, { 
        payment: true,
        status: "Payment Verification Pending"
      })
      const pointsEarned = Math.floor((order ? order.amount : 0) / 100) * 10
      await userModel.findByIdAndUpdate(req.userId, { 
        cartData: {},
        $inc: { loyaltyPoints: pointsEarned }
      })

      res.json({ success: true, message: "Payment Successful" })
    } else {
      await orderModel.findByIdAndDelete(orderId)
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

    await orderModel.findByIdAndUpdate(
      orderId,
      { status }
    )

    // Broadcast the updated status to the client in real-time
    const io = req.app.get("io")
    if (io) {
      io.to(orderId).emit("order_status_update", { orderId, status })
      console.log(`Socket Broadcast: Order ${orderId} status changed to: ${status}`)
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

    const order = await orderModel.findByIdAndUpdate(orderId, {
      riderId: req.userId,
      riderName: rider.name
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
  getRiderEarnings
}
