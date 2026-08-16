import React, { useState, useContext } from 'react'
import './Header.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/Storecontext'
import { sendChatMessage } from '../../utils/gemini'
import { toast } from 'react-toastify'

const Header = () => {
  const { food_list, addToCart } = useContext(StoreContext)
  const [isListening, setIsListening] = useState(false)

  const handleVoiceOrder = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error("Your browser doesn't support Voice Ordering.")
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      toast.info("Listening... Speak your order!", { autoClose: 3000 })
    }

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      toast.success(`You said: "${transcript}". Finding matches...`)
      
      try {
        const history = [{ role: "user", text: `I want to order: ${transcript}. Only recommend the exact best matches and use the ADD_TO_CART tag.` }]
        const reply = await sendChatMessage(history, food_list, "")
        
        // Parse the reply for ADD_TO_CART tags
        const regex = /\[ADD_TO_CART:\s*([a-zA-Z0-9_-]+)(?:\|([^\]]+))?\]/g
        let match
        let addedCount = 0

        while ((match = regex.exec(reply)) !== null) {
          const itemId = match[1]
          let itemName = match[2]
          
          if (!itemName) {
            const foundFood = food_list.find(f => f._id === itemId)
            itemName = foundFood ? foundFood.name : 'Item'
          }

          addToCart(itemId)
          toast.success(`Added ${itemName} to cart! 🛒`)
          addedCount++
        }

        if (addedCount === 0) {
          toast.info("Could not find exact matching items. Try asking the AI Chatbot directly!")
        }
      } catch (err) {
        toast.error("Voice order failed. Try again.")
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      toast.error("Microphone error. Please try again.")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  return (
    <div
      className="header"
      style={{ backgroundImage: `url(${assets.header_img})` }}
    >
      <div className="header-contents">
        <h2>Order your favourite food here</h2>
        <p>
          Choose from a diverse menu featuring a delectable array of dishes
          crafted with the finest ingredients and culinary expertise.
        </p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <a href="#explore-menu"><button>View Menu</button></a>
          <button 
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            onClick={handleVoiceOrder}
          >
            {isListening ? "🎙️ Listening..." : "🎤 Voice Order"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header
