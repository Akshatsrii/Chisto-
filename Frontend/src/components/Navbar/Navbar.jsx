import React, { useState, useEffect, useRef, useContext } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/Storecontext'

const Navbar = ({ setShowLogin }) => {

  const { 
    token, 
    setToken, 
    cartItems, 
    searchQuery, 
    setSearchQuery, 
    showSearch, 
    setShowSearch 
  } = useContext(StoreContext)

  const [menu, setMenu] = useState("home")
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const getCartCount = () => {
    let count = 0
    if (cartItems) {
      for (const item in cartItems) {
        if (cartItems[item] > 0) {
          count += cartItems[item]
        }
      }
    }
    return count
  }
  const navigate = useNavigate()

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleMenuClick = (menuName, sectionId) => {
    setMenu(menuName)
    if (window.location.pathname === "/") {
      scrollToSection(sectionId)
    } else {
      navigate("/", { state: { scrollToSection: sectionId } })
    }
  }

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  // Handle Orders click
  const handleOrdersClick = () => {
    if (!token) {
      // If user is not logged in, show login popup
      setShowDropdown(false)
      setShowLogin(true)
    } else {
      // If logged in, navigate to orders page
      setShowDropdown(false)
      navigate('/myorders')
    }
  }

  // Handle Logout/Sign In click
  const handleLogoutClick = () => {
    if (!token) {
      // If user is not logged in, show login popup
      setShowDropdown(false)
      setShowLogin(true)
    } else {
      // If logged in, logout functionality
      setToken("")
      localStorage.removeItem("token")
      setShowDropdown(false)
      // Navigate to home page (unlogged dashboard)
      navigate('/')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Sync with token changes from context
  useEffect(() => {
    // This ensures navbar updates when token changes
    console.log("Token state in Navbar:", token)
  }, [token])

  return (
    <div className='navbar'>

      {/* LOGO */}
      <Link to="/" onClick={() => setMenu("home")}>
        <img src={assets.logo} alt='logo' className='logo' />
      </Link>

      {/* MENU */}
      <ul className='navbar-menu'>
        <li className={menu === "home" ? "active" : ""} onClick={() => handleMenuClick("home", "home")}>Home</li>
        <li className={menu === "menu" ? "active" : ""} onClick={() => handleMenuClick("menu", "explore-menu")}>Menu</li>
        <li className={menu === "mobile-app" ? "active" : ""} onClick={() => handleMenuClick("mobile-app", "app-download")}>Mobile-app</li>
        <li className={menu === "contact-us" ? "active" : ""} onClick={() => handleMenuClick("contact-us", "footer")}>Contact us</li>
      </ul>

      {/* RIGHT */}
      <div className='navbar-right'>
        {showSearch ? (
          <div className="navbar-search-bar-inline">
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-inline-input"
              autoFocus
            />
            <span className="close-search-btn" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>×</span>
          </div>
        ) : (
          <img src={assets.search_icon} alt='search' onClick={() => setShowSearch(true)} style={{ cursor: "pointer" }} />
        )}

        {/* CART */}
        <div className='navbar-search-icon'>
          <Link to="/cart">
            <img src={assets.basket_icon} alt='cart' />
          </Link>
          {getCartCount() > 0 && <div className='dot'>{getCartCount()}</div>}
        </div>

        {/* PROFILE DROPDOWN */}
        <div className="navbar-profile" ref={dropdownRef}>
          <img 
            src={assets.profile_icon} 
            alt="profile" 
            onClick={toggleDropdown}
          />

          {/* Dropdown shows for both logged in and not logged in users */}
          <ul className={`nav-profile-dropdown ${showDropdown ? 'show' : ''}`}>
            <li onClick={handleOrdersClick}>
              <img src={assets.bag_icon} alt="" />
              <p>Orders</p>
            </li>

            <hr />

            <li onClick={handleLogoutClick}>
              <img src={assets.logout_icon} alt="" />
              <p>{token ? 'Logout' : 'Sign In'}</p>
            </li>
          </ul>
        </div>

      </div>

    </div>
  )
}

export default Navbar