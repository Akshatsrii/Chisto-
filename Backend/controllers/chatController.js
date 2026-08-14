const foodModel = require("../models/foodModel")

const handleChat = async (req, res) => {
  try {
    const { message, chatHistory } = req.body

    if (!message) {
      return res.json({ success: false, message: "Message is required" })
    }

    // Fetch all available foods to provide to Gemini context
    const foods = await foodModel.find({})
    const menuList = foods.map(f => `- ${f.name} (Restaurant: ${f.restaurantName}, Category/Taste: ${f.category}): $${f.price}, Rating: ${f.averageRating || '4.5'}/5. Description: ${f.description}`).join("\n")

    const systemPrompt = `You are Chisto Food Assistant, the friendly AI chatbot for "Chisto" - a premium food ordering app (like Zomato).
Your goal is to help users find the perfect food and restaurants, answer food/recipe queries, suggest dishes and restaurants from our real menu, and keep them happy.
Always be polite, clean, and helpful. Use simple formatting (emojis, lists, bold text) in your responses.

Here is Chisto's live menu available right now:
${menuList}

Guidelines:
1. Suggest RESTAURANTS and specific dishes from our live menu database based on user query (e.g. price limits, vegetarian, spicy, taste preferences, rating, restaurant name).
2. If they ask for food outside the menu, suggest the closest alternative we have on our menu and from available restaurants.
3. When recommending restaurants, answer based on restaurant rating, price, and taste/category.
4. Keep answers concise (max 3-4 sentences per response) so they fit nicely in a chat bubble.`

    // Construct request contents
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] }
    ]

    // Append history
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach(ch => {
        contents.push({
          role: ch.role === "user" ? "user" : "model",
          parts: [{ text: ch.text }]
        })
      })
    }

    // Append current message
    contents.push({ role: "user", parts: [{ text: message }] })

    const apiKey = process.env.GEMINI_API_KEY || "YOUR_FALLBACK_API_KEY" // Fallback or empty
    if (!process.env.GEMINI_API_KEY) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in your .env file.")
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contents })
      }
    )

    const data = await response.json()

    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const reply = data.candidates[0].content.parts[0].text
      return res.json({ success: true, reply })
    }

    res.json({ success: false, message: "Failed to generate reply from AI" })
  } catch (error) {
    console.error("AI Chat error:", error.message)
    res.json({
      success: false,
      message: "AI Chat Assistant is temporarily unavailable. Make sure your GEMINI_API_KEY is configured in Backend/.env"
    })
  }
}

module.exports = { handleChat }
