require("dotenv").config()

const express = require("express")
const cors = require("cors")
const connectDB = require("./config/db")
const jwt = require("jsonwebtoken")
const userModel = require("./models/userModel")
const orderModel = require("./models/orderModel")
const Stripe = require("stripe")
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const foodRouter = require("./routes/foodRoute")
const userRouter = require("./routes/userRoute")
const cartRouter = require("./routes/cartRoute")   // ✅ ADDED
const orderRouter = require("./routes/orderRoute")
const chatRouter = require("./routes/chatRoute")
const couponRouter = require("./routes/couponRoute")
const reviewRouter = require("./routes/reviewRoute")
const restaurantRouter = require("./routes/restaurantRoute")
const initCronJobs = require("./cronJobs")


const app = express()
const port = process.env.PORT || 4000

// ✅ CONNECT DATABASE
connectDB()

// Middlewares
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use("/uploads", express.static("uploads"))

// Routes
app.use("/api/food", foodRouter)
app.use("/api/user", userRouter)
app.use("/api/cart", cartRouter)     // ✅ ADDED
app.use("/api/order", orderRouter)
app.use("/api/chat", chatRouter)
app.use("/api/coupon", couponRouter)
app.use("/api/review", reviewRouter)
app.use("/api/restaurant", restaurantRouter)


// Test Route
app.get("/", (req, res) => {
  res.send("API Working")
})

// Server Wrapper for Socket.IO
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Attach io to express app instance
app.set("io", io)

// Socket.IO Connection & Room Listeners
const groupCarts = {} // { roomId: { hostId: String, members: { [userId]: { name, items: [] } } } }

io.on("connection", (socket) => {
  console.log(`User connected to socket: ${socket.id}`)

  socket.on("join_order_room", (orderId) => {
    socket.join(orderId)
    console.log(`Socket ${socket.id} joined order room: ${orderId}`)
  })

  // GROUP ORDERING: JOIN
  socket.on("join_group_cart", async ({ roomId, token }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const userId = decoded.id
      const user = await userModel.findById(userId)
      if (!user) return
      
      socket.join(roomId)
      if (!groupCarts[roomId]) {
        groupCarts[roomId] = { hostId: userId, members: {} }
      }
      
      if (!groupCarts[roomId].members[userId]) {
        groupCarts[roomId].members[userId] = { name: user.name, items: [] }
      }
      
      io.to(roomId).emit("group_cart_updated", groupCarts[roomId])
    } catch (e) {
      console.log("Socket join group error", e)
    }
  })

  // GROUP ORDERING: SYNC ITEMS
  socket.on("sync_group_items", async ({ roomId, token, items }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const userId = decoded.id
      if (groupCarts[roomId] && groupCarts[roomId].members[userId]) {
        groupCarts[roomId].members[userId].items = items
        io.to(roomId).emit("group_cart_updated", groupCarts[roomId])
      }
    } catch (e) {
      console.log("Socket sync group items error", e)
    }
  })

  // GROUP ORDERING: CHECKOUT
  socket.on("checkout_group_cart", async ({ roomId, token, address, distance, splitType, surgeFee, weatherCondition }) => {
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET)
       const hostId = decoded.id
       const cart = groupCarts[roomId]
       if (!cart || cart.hostId !== hostId) return

       const frontend_url = "http://localhost:5173"
       const memberIds = Object.keys(cart.members)
       const totalMembers = memberIds.length
       if (totalMembers === 0) return

       let grandTotalItems = []
       let grandTotalAmount = 0
       
       for (const uid of memberIds) {
          const userItems = cart.members[uid].items
          grandTotalItems.push(...userItems)
          for (const item of userItems) {
             grandTotalAmount += item.price * item.quantity
          }
       }
       
       const deliveryFee = grandTotalAmount === 0 ? 0 : 40
       grandTotalAmount += deliveryFee

       // Create parent order in DB
       const newOrder = new orderModel({
         userId: hostId,
         items: grandTotalItems,
         amount: grandTotalAmount,
         address,
         payment: false,
         status: "Awaiting Group Payment",
         distance: distance || 5,
         isScheduled: false,
         surgeFee: surgeFee || 0,
         weatherCondition: weatherCondition || "Clear"
       })
       await newOrder.save()

       const paymentLinks = {}

       // Calculate individual shares
       for (const uid of memberIds) {
          let userAmount = 0
          if (splitType === "Even Split") {
            userAmount = Math.round(grandTotalAmount / totalMembers)
          } else {
            // Itemized Split
            let myItemsAmount = 0
            for (const item of cart.members[uid].items) {
               myItemsAmount += item.price * item.quantity
            }
            userAmount = myItemsAmount + Math.round(deliveryFee / totalMembers)
          }

          if (userAmount > 0) {
            const session = await stripe.checkout.sessions.create({
              line_items: [{
                 price_data: {
                   currency: "inr",
                   product_data: { name: `Group Order Share (${splitType})` },
                   unit_amount: userAmount * 100
                 },
                 quantity: 1
              }],
              mode: "payment",
              success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
              cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`
            })
            paymentLinks[uid] = session.url
          }
       }

       io.to(roomId).emit("group_payment_links", { links: paymentLinks })

     } catch (e) {
       console.log("Group checkout error", e)
     }
  })

  // ================= WEBRTC VERIFICATION =================
  socket.on("webrtc_offer", (data) => {
    socket.to(data.orderId).emit("webrtc_offer", data)
  })

  socket.on("webrtc_answer", (data) => {
    socket.to(data.orderId).emit("webrtc_answer", data)
  })

  socket.on("webrtc_ice_candidate", (data) => {
    socket.to(data.orderId).emit("webrtc_ice_candidate", data)
  })

  socket.on("webrtc_end", (data) => {
    socket.to(data.orderId).emit("webrtc_end", data)
  })

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

// Initialize Cron Jobs
initCronJobs(io)

// Server Start
if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`)
  })
}

module.exports = app
