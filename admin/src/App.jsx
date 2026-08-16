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
import Availability from './pages/Availability/Availability'
import Coupons from './pages/Coupons/Coupons'
import CommandPalette from './components/CommandPalette/CommandPalette'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("admin-token") || "")
  const [role, setRole] = useState(localStorage.getItem("admin-role") || "")
  const [restaurantName, setRestaurantName] = useState(localStorage.getItem("admin-restaurantName") || "")
  const [cmdkOpen, setCmdkOpen] = useState(false)

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
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
        <ToastContainer position="top-right" autoClose={3000} />
        <Navbar setCmdkOpen={setCmdkOpen} />
        <hr className="border-gray-200 dark:border-dark-border" />
        <Auth onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <CommandPalette open={cmdkOpen} setOpen={setCmdkOpen} />

      <Navbar setCmdkOpen={setCmdkOpen} />
      <hr className="border-gray-200 dark:border-dark-border m-0" />

      <div className="app-content flex">
        <Sidebar />

        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to={role === "rider" ? "/rider-deliveries" : "/dashboard"} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add" element={<Add />} />
            <Route path="/list" element={<List />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/rider-deliveries" element={<RiderDeliveries />} />
            <Route path="/rider-earnings" element={<RiderEarnings />} />
            <Route path="*" element={<Navigate to={role === "rider" ? "/rider-deliveries" : "/dashboard"} />} />
          </Routes>
        </div>

      </div>
    </div>
  )
}

export default App
