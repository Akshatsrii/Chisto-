import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './pages/Login/Login'
import RiderDeliveries from './pages/Dashboard/RiderDeliveries'

function App() {
  const [token, setToken] = useState("")

  useEffect(() => {
    const savedToken = localStorage.getItem("rider-token")
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Login setToken={setToken} />} />
        <Route path="/dashboard" element={token ? <RiderDeliveries /> : <Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
