const express = require("express")
const { handleChat, handleVision } = require("../controllers/chatController")

const chatRouter = express.Router()

chatRouter.post("/query", handleChat)
chatRouter.post("/vision", handleVision)

module.exports = chatRouter
