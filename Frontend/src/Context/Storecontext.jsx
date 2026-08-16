import { createContext, useState, useEffect } from "react"
import axios from "axios"

export const StoreContext = createContext(null)

const StoreContextProvider = ({ children }) => {

  const url = "http://localhost:4000"

  const [food_list, setFoodList] = useState([])
  const [cartItems, setCartItems] = useState({})
  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  )

  const [showLogin, setShowLogin] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [appliedPromo, setAppliedPromo] = useState("")

  // ================= FETCH FOOD LIST =================
  const fetchFoodList = async () => {
    try {
      const res = await axios.get(url + "/api/food/list")
      if (res.data.success) {
        setFoodList(res.data.data)
      }
    } catch (err) {
      console.log("Food fetch error", err)
    }
  }

  // ================= FETCH CART =================
  const fetchCartData = async () => {
    if (!token) return

    try {
      const res = await axios.get(url + "/api/cart/get", {
        headers: { token }
      })
      if (res.data.success) {
        setCartItems(res.data.cartData)
      }
    } catch (err) {
      console.log("Cart fetch error", err)
    }
  }

  // ================= ADD TO CART =================
  const addToCart = async (itemId) => {
    if (!token) {
      setShowLogin(true)
      return
    }

    // 🔥 Optimistic UI
    setCartItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }))

    try {
      await axios.post(
        url + "/api/cart/add",
        { itemId },
        { headers: { token } }
      )
    } catch (err) {
      console.log("Add cart error", err)
      fetchCartData() // rollback
    }
  }

  // ================= REMOVE FROM CART =================
  const removeFromCart = async (itemId) => {
    if (!token) return

    // 🔥 Optimistic UI
    setCartItems(prev => {
      const updated = { ...prev }
      updated[itemId] === 1
        ? delete updated[itemId]
        : updated[itemId]--
      return updated
    })

    try {
      await axios.post(
        url + "/api/cart/remove",
        { itemId },
        { headers: { token } }
      )
    } catch (err) {
      console.log("Remove cart error", err)
      fetchCartData()
    }
  }

  // ================= TOTAL CART AMOUNT =================
  const getTotalCartAmount = () => {
    let total = 0
    for (const itemId in cartItems) {
      const product = food_list.find(
        item => item._id === itemId
      )
      if (product) {
        total += product.price * cartItems[itemId]
      }
    }
    return total
  }

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchFoodList()

    if (token) {
      fetchCartData()
      localStorage.setItem("token", token)
    } else {
      localStorage.removeItem("token")
      setCartItems({})
    }
  }, [token])

  const queryChatbot = async (message, chatHistory) => {
    try {
      const res = await axios.post(url + "/api/chat/query", { message, chatHistory })
      return res.data
    } catch (err) {
      console.log("Chatbot query error", err)
      return { success: false, message: "AI Assistant offline." }
    }
  }

  const addFoodReview = async (foodId, rating, comment) => {
    try {
      const res = await axios.post(
        url + `/api/food/review/${foodId}`,
        { rating, comment },
        { headers: { token } }
      )
      if (res.data.success) {
        fetchFoodList()
      }
      return res.data
    } catch (err) {
      console.log("Review submission error", err)
      return { success: false, message: "Could not submit review." }
    }
  }

  return (
    <StoreContext.Provider
      value={{
        food_list,
        cartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        token,
        setToken,
        url,
        queryChatbot,
        addFoodReview,
        showLogin,
        setShowLogin,
        selectedRestaurant,
        setSelectedRestaurant,
        searchQuery,
        setSearchQuery,
        showSearch,
        setShowSearch,
        promoDiscount,
        setPromoDiscount,
        appliedPromo,
        setAppliedPromo
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export default StoreContextProvider
