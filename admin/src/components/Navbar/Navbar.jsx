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

  return (
    <div className='navbar bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-6 py-4 flex justify-between items-center transition-colors duration-300'>
      <img className='logo h-8' src={assets.logo} alt="Logo" />
      
      <div className="flex items-center gap-6">
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
