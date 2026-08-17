import React, { useContext, useEffect } from "react"
import axios from "axios"
import { Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar/Navbar"
import Footer from "./components/Footer/Footer"
import LoginPopup from "./components/LoginPopup/LoginPopup"
import Chatbot from "./components/Chatbot/Chatbot"

const Home = React.lazy(() => import("./pages/Home/Home"))
const Cart = React.lazy(() => import("./pages/Cart/Cart"))
const PlaceOrder = React.lazy(() => import("./pages/Placeorder/Placeorder"))
const MyOrders = React.lazy(() => import("./pages/MyOrders/MyOrders"))
const Restaurant = React.lazy(() => import("./pages/Restaurant/Restaurant"))
const OrderConfirm = React.lazy(() => import("./pages/OrderConfirm/OrderConfirm"))
const Verify = React.lazy(() => import("./pages/Verify/Verify"))
const Profile = React.lazy(() => import("./pages/Profile/Profile"))

import { StoreContext } from "./Context/Storecontext"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { getOfflineOrders, clearOfflineOrder } from "./utils/idb"

const App = () => {
  const { showLogin, setShowLogin, url, token } = useContext(StoreContext)

  useEffect(() => {
    const handleOnline = async () => {
      toast.info("📶 Back online! Syncing pending orders...")
      const pendingOrders = await getOfflineOrders()
      
      if (pendingOrders && pendingOrders.length > 0) {
        if (!token) {
           toast.error("Please login to sync your pending offline orders.")
           return
        }

        let successCount = 0
        for (const order of pendingOrders) {
          try {
            const res = await axios.post(`${url}/api/order/place`, order, {
              headers: { token }
            })
            if (res.data.success) {
              await clearOfflineOrder(order.id)
              successCount++
            }
          } catch (e) {
            console.error("Failed to sync order", e)
          }
        }
        
        if (successCount > 0) {
           toast.success(`✅ Successfully synced ${successCount} offline order(s)!`)
        }
      }
    }

    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [url, token])

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}

      <div className="app">
        <Navbar setShowLogin={setShowLogin} />

        <React.Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order" element={<PlaceOrder />} />
            <Route path="/myorders" element={<MyOrders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/restaurant/:id" element={<Restaurant />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/order-confirm" element={<OrderConfirm />} />
          </Routes>
        </React.Suspense>
      </div>

      <Footer />
      <Chatbot />
    </>
  )
}

export default App
