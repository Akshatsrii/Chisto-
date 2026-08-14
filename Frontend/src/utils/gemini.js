import { GoogleGenAI } from "@google/genai";

// Read API key from Vite environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

const ai = new GoogleGenAI({
  apiKey: apiKey,
});

export async function sendChatMessage(history, foodList = [], previousOrdersText = "") {
  try {
    const menuText = foodList
      .map(f => `- ${f.name} (Restaurant: ${f.restaurantName}, Category/Taste: ${f.category}, ID: ${f._id}): Price: ₹${f.price}, Rating: ${f.averageRating || '4.5'}/5. Description: ${f.description}`)
      .join("\n");

    const SYSTEM_PROMPT = `
You are Chisto Food Assistant, the official friendly AI chatbot for "Chisto" food delivery app.

About Chisto:
- Multi-Restaurant Smart Food Delivery Platform.
- Users can order food online, track orders, and securely pay online using Stripe or COD.
- Users can review and rate individual dishes.
- Accents & styling: Sleek, premium, dark navy blue theme (#0c2340).

User's Previous Orders history:
${previousOrdersText ? previousOrdersText : "None (User is new or has no completed orders yet)"}

Chisto Live Menu database:
${menuText}

YOUR INSTRUCTIONS:
1. Suggest RESTAURANTS and specific dishes from our live menu database based on user query (e.g. price limits, vegetarian, spicy, taste preferences, rating, restaurant name).
2. If the user asks for recommendations (e.g., "suggest a good restaurant with high rating", "veg food under 300", "what's the best tasting pizza"), find matching restaurants and items in the Chisto Live Menu list above. Answer based on restaurant rating, price, and taste/category.
3. CRITICAL: Whenever you mention or recommend a dish from the Chisto Live Menu, you MUST append a special Add-to-Cart tag in the exact format: [ADD_TO_CART: <item_id>|<item_name>].
   - Example: "I recommend trying the delicious **Chicken Tikka** from **Chisto Kitchen** [ADD_TO_CART: 60b9f123c5a61234|Chicken Tikka] (₹280)!"
   - Replace <item_id> with the exact "ID" of that food item from the menu database above (e.g., 60b9...). Do not invent IDs!
   - Replace <item_name> with the exact name of the item.
4. Keep answers short, friendly, and formatted nicely with markdown bullet points and emojis. Ensure the chatbot experience is helpful for finding restaurants based on rating, price, and taste.
`;

    const conversation = [
      {
        role: "user",
        parts: [
          {
            text: SYSTEM_PROMPT,
          },
        ],
      },
      ...history.map((msg) => ({
        role: msg.role === "model" || msg.role === "bot" ? "model" : "user",
        parts: [
          {
            text: msg.text,
          },
        ],
      })),
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: conversation,
      config: {
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Sorry, I am facing connectivity issues. Please make sure VITE_GEMINI_API_KEY is configured in your Frontend environment.";
  }
}
