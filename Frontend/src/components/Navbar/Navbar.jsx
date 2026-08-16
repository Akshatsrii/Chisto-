import React, { useState, useEffect, useRef, useContext } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/Storecontext'

import { useTranslation } from 'react-i18next'

const Navbar = ({ setShowLogin }) => {
  const { t, i18n } = useTranslation()

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
      setShowDropdown(false)
      setShowLogin(true)
    } else {
      setShowDropdown(false)
      navigate('/myorders')
    }
  }

  // Handle Logout/Sign In click
  const handleLogoutClick = () => {
    if (!token) {
      setShowDropdown(false)
      setShowLogin(true)
    } else {
      setToken("")
      localStorage.removeItem("token")
      setShowDropdown(false)
      navigate('/')
    }
  }

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value)
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

  return (
    <div className='navbar'>
      {/* LOGO */}
      <Link to="/" onClick={() => setMenu("home")}>
        <img src={assets.logo} alt='logo' className='logo' />
      </Link>

      {/* MENU */}
      <ul className='navbar-menu'>
        <li className={menu === "home" ? "active" : ""} onClick={() => handleMenuClick("home", "home")}>{t('navbar.home')}</li>
        <li className={menu === "menu" ? "active" : ""} onClick={() => handleMenuClick("menu", "explore-menu")}>{t('navbar.menu')}</li>
        <li className={menu === "mobile-app" ? "active" : ""} onClick={() => handleMenuClick("mobile-app", "app-download")}>{t('navbar.mobileApp')}</li>
        <li className={menu === "contact-us" ? "active" : ""} onClick={() => handleMenuClick("contact-us", "footer")}>{t('navbar.contactUs')}</li>
      </ul>

      {/* RIGHT */}
      <div className='navbar-right'>
        {showSearch ? (
          <div className="navbar-search-bar-inline">
            <input 
              type="text" 
              placeholder={t('navbar.search')}
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
        
        {/* LANGUAGE TOGGLE */}
        <select onChange={changeLanguage} defaultValue={i18n.language} className="lang-toggle" style={{ padding: '5px', borderRadius: '5px', cursor: 'pointer', border: '1px solid #ccc' }}>
          <option value="en">EN</option>
          <option value="hi">HI</option>
        </select>

        {/* PROFILE DROPDOWN */}
        <div className="navbar-profile" ref={dropdownRef}>
          <img 
            src={assets.profile_icon} 
            alt="profile" 
            onClick={toggleDropdown}
          />

          <ul className={`nav-profile-dropdown ${showDropdown ? 'show' : ''}`}>
            <li onClick={handleOrdersClick}>
              <img src={assets.bag_icon} alt="" />
              <p>{t('navbar.orders')}</p>
            </li>
            <hr />
            <li onClick={handleLogoutClick}>
              <img src={assets.logout_icon} alt="" />
              <p>{token ? t('navbar.logout') : t('navbar.signIn')}</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar