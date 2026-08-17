import React, { useState, useEffect } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Moon, Sun, Command } from 'lucide-react'

const Navbar = ({ setCmdkOpen }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const role = localStorage.getItem("admin-role")
  const restaurantName = localStorage.getItem("admin-restaurantName")
  const [kitchenLoad, setKitchenLoad] = useState("Normal")

  useEffect(() => {
    if (role === 'restaurant' && restaurantName) {
      fetch(`${import.meta.env.VITE_BACKEND_URL || "https://food-ordering-6lji.onrender.com"}/api/restaurant/availability/${restaurantName}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setKitchenLoad(data.data.kitchenLoad || "Normal")
          }
        })
        .catch(err => console.log(err))
    }
  }, [role, restaurantName])

  const updateKitchenLoad = async (load) => {
    setKitchenLoad(load)
    const token = localStorage.getItem("admin-token")
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL || "https://food-ordering-6lji.onrender.com"}/api/restaurant/availability/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "token": token },
        body: JSON.stringify({ restaurantName, kitchenLoad: load })
      })
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className='navbar bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-6 py-4 flex justify-between items-center transition-colors duration-300'>
      <img className='logo h-8' src={assets.logo} alt="Logo" />
      
      <div className="flex items-center gap-6">
        
        {role === 'restaurant' && (
          <div className="kitchen-load flex items-center gap-2">
            <span style={{fontSize: '12px', fontWeight: 'bold'}}>Kitchen:</span>
            <select 
              value={kitchenLoad} 
              onChange={(e) => updateKitchenLoad(e.target.value)}
              style={{ padding: '4px', borderRadius: '4px', fontSize: '12px', border: '1px solid #ccc' }}
            >
              <option value="Normal">🟢 Normal</option>
              <option value="Busy">🟠 Busy</option>
              <option value="Overwhelmed">🔴 Overwhelmed</option>
            </select>
          </div>
        )}

        <button 
          onClick={() => setCmdkOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-bg rounded-md border border-gray-200 dark:border-dark-border hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <Command size={14} /> 
          <span>Search</span>
          <kbd className="ml-2 font-mono text-xs font-semibold bg-gray-200 dark:bg-gray-700 px-1.5 rounded">⌘K</kbd>
        </button>

        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <img className='profile h-10 w-10 rounded-full' src={assets.profile_image} alt="Profile" />
      </div>
    </div>
  )
}

export default Navbar
