import React, { useState, useRef, useEffect, useContext } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import './Chatbot.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/Storecontext'
import { sendChatMessage } from '../../utils/gemini'

const Chatbot = () => {
  const { food_list, addToCart, token, url } = useContext(StoreContext)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([
    { role: 'model', text: 'Hi! I am Chisto AI Assistant. Ask me to suggest delicious food or help you choose from our menu! 🍔🍕' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [previousOrdersText, setPreviousOrdersText] = useState('')
  const [isListening, setIsListening] = useState(false)
  
  const navigate = useNavigate()
  
  const messagesEndRef = useRef(null)

  const toggleChat = () => setIsOpen(!isOpen)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [history, isLoading])

  // Fetch previous orders as recommendation context when opening the chatbot
  const fetchPreviousOrders = async () => {
    if (!token) return
    try {
      const res = await axios.get(`${url}/api/order/user`, {
        headers: { token }
      })
      if (res.data.success && res.data.data.length > 0) {
        const pastDishes = res.data.data
          .flatMap(order => order.items.map(item => item.name))
          .filter((value, index, self) => self.indexOf(value) === index) // Unique names
          .join(", ")
        setPreviousOrdersText(pastDishes)
      }
    } catch (err) {
      console.warn("Failed to load previous orders for chatbot context:", err)
    }
  }

  useEffect(() => {
    if (isOpen && token) {
      fetchPreviousOrders()
    }
  }, [isOpen, token])

  const handleAddFromChat = (itemId, itemName) => {
    addToCart(itemId)
    toast.success(`Added ${itemName} to cart! 🛒`)
    setIsOpen(false) // Close chatbot to show cart
    navigate('/cart') // Navigate to cart page
  }

  // Parse [ADD_TO_CART: id|name] and replace with interactive add buttons
  const renderMessageContent = (text) => {
    const regex = /\[ADD_TO_CART:\s*([a-zA-Z0-9_-]+)\|([^\]]+)\]/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index

      if (matchIndex > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, matchIndex)}</span>)
      }

      const itemId = match[1]
      const itemName = match[2]

      parts.push(
        <button
          key={`btn-${matchIndex}`}
          className="chatbot-add-to-cart-btn"
          onClick={() => handleAddFromChat(itemId, itemName)}
        >
          🛒 Add {itemName} to Cart
        </button>
      )

      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>)
    }

    return parts.length > 0 ? parts : text
  }

  // --- Voice Recognition Setup ---
  let recognition = null;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast.error("Microphone error. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const toggleListen = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  }

  // --- Mood Chips Handler ---
  const handleMoodClick = (moodPrompt) => {
    setMessage(moodPrompt);
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    const userMessage = message.trim()
    setMessage('')
    setHistory(prev => [...prev, { role: 'user', text: userMessage }])
    setIsLoading(true)

    try {
      const historyForAPI = [
        ...history.slice(1),
        { role: 'user', text: userMessage }
      ]

      const reply = await sendChatMessage(historyForAPI, food_list, previousOrdersText)
      setHistory(prev => [...prev, { role: 'model', text: reply }])
    } catch (error) {
      setHistory(prev => [...prev, { role: 'model', text: 'Something went wrong. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chisto-chatbot-container">
      {/* Floating Button */}
      <button className={`chatbot-toggle-btn ${isOpen ? 'open' : ''}`} onClick={toggleChat}>
        {isOpen ? (
          <span className="close-icon">&times;</span>
        ) : (
          <div className="chat-btn-content">
            <span className="chat-icon">💬</span>
            <span className="chat-badge-dot"></span>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <h3>Chisto AI</h3>
              <p>Online | Powered by Gemini</p>
            </div>
            <button className="chatbot-close-btn" onClick={toggleChat}>&times;</button>
          </div>

          <div className="chatbot-messages">
            {history.map((msg, index) => (
              <div key={index} className={`chat-bubble-wrapper ${msg.role}`}>
                <div className={`chat-bubble ${msg.role}`}>
                  {renderMessageContent(msg.text)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble-wrapper model">
                <div className="chat-bubble model typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-mood-chips">
            <button className="mood-chip" onClick={() => handleMoodClick("Surprise me with a highly rated dish based on my past orders!")}>🎲 Surprise Me</button>
            <button className="mood-chip" onClick={() => handleMoodClick("Suggest something healthy and low-calorie.")}>🥗 Healthy</button>
            <button className="mood-chip" onClick={() => handleMoodClick("I'm craving something really spicy!")}>🌶️ Spicy</button>
            <button className="mood-chip" onClick={() => handleMoodClick("What's the best budget meal under ₹200?")}>💸 Budget</button>
          </div>

          <form className="chatbot-input-area" onSubmit={handleSend}>
            {recognition && (
              <button 
                type="button" 
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListen}
                title="Speak your order"
              >
                🎤
              </button>
            )}
            <input
              type="text"
              placeholder="Ask for food recommendations..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !message.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Chatbot
