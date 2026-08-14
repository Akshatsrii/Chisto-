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

const handleVision = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body
    if (!imageBase64) {
      return res.json({ success: false, message: "Image is required" })
    }

    const foods = await foodModel.find({})
    const menuList = foods.map(f => `- ID: ${f._id} | Name: ${f.name} | Category: ${f.category} | Price: $${f.price}`).join("\n")

    const systemPrompt = `You are Chisto's AI Vision Assistant.
The user has uploaded an image of food. Identify the food in the image.
Then, look at our live menu below and find the BEST matching item (if any).
Menu:
${menuList}

You MUST return your response as a valid JSON object EXACTLY like this:
{
  "reply": "I see a delicious pepperoni pizza! We have an amazing Margherita Pizza on our menu that you might love. Would you like to add it to your cart?",
  "matchedItemId": "id_of_the_matched_item_from_menu_or_null_if_no_match"
}
Do not use markdown blocks around the JSON.`

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.json({ success: false, message: "Gemini API key missing" })
    }

    // Clean base64 string if it contains data:image/...;base64,
    let base64Data = imageBase64
    if (base64Data.includes("base64,")) {
      base64Data = base64Data.split("base64,")[1]
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                {
                  inline_data: {
                    mime_type: mimeType || "image/jpeg",
                    data: base64Data
                  }
                }
              ]
            }
          ]
        })
      }
    )

    const data = await response.json()
    
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const rawText = data.candidates[0].content.parts[0].text
      // Extract JSON from response (in case Gemini added markdown block)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return res.json({ success: true, reply: parsed.reply, matchedItemId: parsed.matchedItemId })
      } else {
        return res.json({ success: true, reply: rawText, matchedItemId: null })
      }
    }

    res.json({ success: false, message: data.error ? data.error.message : "Failed to analyze image" })
  } catch (error) {
    console.error("AI Vision error:", error.message)
    res.json({ success: false, message: "AI Vision is temporarily unavailable." })
  }
}

module.exports = { handleChat, handleVision }
