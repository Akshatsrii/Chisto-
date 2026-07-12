import React, { useContext } from "react"
import { Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar/Navbar"
import Footer from "./components/Footer/Footer"
import LoginPopup from "./components/LoginPopup/LoginPopup"
import Chatbot from "./components/Chatbot/Chatbot"

import Home from "./pages/Home/Home"
import Cart from "./pages/Cart/Cart"
import PlaceOrder from "./pages/Placeorder/Placeorder"
import MyOrders from "./pages/MyOrders/MyOrders"   // ✅ REQUIRED IMPORT
import OrderConfirm from "./pages/OrderConfirm/OrderConfirm"
import Verify from "./pages/Verify/Verify"

import { StoreContext } from "./Context/Storecontext"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const App = () => {
  const { showLogin, setShowLogin } = useContext(StoreContext)

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}

      <div className="app">
        <Navbar setShowLogin={setShowLogin} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/myorders" element={<MyOrders />} /> {/* ✅ */}
          <Route path="/verify" element={<Verify />} />
          <Route path="/order-confirm" element={<OrderConfirm />} />
        </Routes>
      </div>

      <Footer />
      <Chatbot />
    </>
  )
}

export default App
