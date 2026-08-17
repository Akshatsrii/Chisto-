import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'

const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'))
const Add = React.lazy(() => import('./pages/Add/Add'))
const List = React.lazy(() => import('./pages/List/List'))
const Orders = React.lazy(() => import('./pages/Orders/Orders'))
const Auth = React.lazy(() => import('./pages/Auth/Auth'))
const Availability = React.lazy(() => import('./pages/Availability/Availability'))
const Coupons = React.lazy(() => import('./pages/Coupons/Coupons'))
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
        <React.Suspense fallback={<div className="flex justify-center items-center py-20">Loading...</div>}>
          <Auth onLoginSuccess={handleLoginSuccess} />
        </React.Suspense>
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
          <React.Suspense fallback={<div className="flex justify-center items-center py-20">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add" element={<Add />} />
              <Route path="/list" element={<List />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/availability" element={<Availability />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </React.Suspense>
        </div>

      </div>
    </div>
  )
}

export default App
