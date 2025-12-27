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

  // ✅ FETCH FOOD LIST FROM BACKEND
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

  // ✅ FETCH CART FROM BACKEND
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

  // ✅ ADD TO CART (BACKEND FIRST)
  const addToCart = async (itemId) => {
    if (!token) return

    try {
      const res = await axios.post(
        url + "/api/cart/add",
        { itemId },
        { headers: { token } }
      )

      if (res.data.success) {
        fetchCartData()
      }
    } catch (err) {
      console.log("Add cart error", err)
    }
  }

  // ✅ REMOVE FROM CART (BACKEND FIRST)
  const removeFromCart = async (itemId) => {
    if (!token) return

    try {
      const res = await axios.post(
        url + "/api/cart/remove",
        { itemId },
        { headers: { token } }
      )

      if (res.data.success) {
        fetchCartData()
      }
    } catch (err) {
      console.log("Remove cart error", err)
    }
  }

  // ✅ TOTAL CART AMOUNT
  const getTotalCartAmount = () => {
    let total = 0

    for (const itemId in cartItems) {
      const product = food_list.find(
        (item) => item._id === itemId
      )
      if (product) {
        total += product.price * cartItems[itemId]
      }
    }
    return total
  }

  // ✅ INITIAL LOAD
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
        url
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export default StoreContextProvider
