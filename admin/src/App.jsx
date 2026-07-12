import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'

import Dashboard from './pages/Dashboard/Dashboard'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Auth from './pages/Auth/Auth'
import RiderDeliveries from './pages/RiderDeliveries/RiderDeliveries'
import RiderEarnings from './pages/RiderEarnings/RiderEarnings'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("admin-token") || "")
  const [role, setRole] = useState(localStorage.getItem("admin-role") || "")
  const [restaurantName, setRestaurantName] = useState(localStorage.getItem("admin-restaurantName") || "")

  const handleLoginSuccess = (newToken, newRole, newRestName) => {
    setToken(newToken)
    setRole(newRole)
    setRestaurantName(newRestName)
  }

  // Handle auto logout on token expiration or invalidity
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("admin-token") || "")
      setRole(localStorage.getItem("admin-role") || "")
      setRestaurantName(localStorage.getItem("admin-restaurantName") || "")
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (!token) {
    return (
      <div>
        <ToastContainer position="top-right" autoClose={3000} />
        <Navbar />
        <hr />
        <Auth onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />

      <Navbar />
      <hr />

      <div className="app-content">
        <Sidebar />

        <Routes>
          <Route path="/" element={<Navigate to={role === "rider" ? "/rider-deliveries" : "/dashboard"} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add" element={<Add />} />
          <Route path="/list" element={<List />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/rider-deliveries" element={<RiderDeliveries />} />
          <Route path="/rider-earnings" element={<RiderEarnings />} />
          <Route path="*" element={<Navigate to={role === "rider" ? "/rider-deliveries" : "/dashboard"} />} />
        </Routes>

      </div>
    </div>
  )
}

export default App
