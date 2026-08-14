require("dotenv").config()

const express = require("express")
const cors = require("cors")
const connectDB = require("./config/db")

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
io.on("connection", (socket) => {
  console.log(`User connected to socket: ${socket.id}`)

  socket.on("join_order_room", (orderId) => {
    socket.join(orderId)
    console.log(`Socket ${socket.id} joined order room: ${orderId}`)
  })

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

// Initialize Cron Jobs
initCronJobs(io)

// Server Start
server.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`)
})
