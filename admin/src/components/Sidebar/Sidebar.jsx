import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  const role = localStorage.getItem("admin-role") || ""

  const handleLogout = () => {
    localStorage.removeItem("admin-token")
    localStorage.removeItem("admin-role")
    localStorage.removeItem("admin-restaurantName")
    window.location.reload()
  }

  return (
    <div className='sidebar'>
      <div className='sidebar-options'>
        {role === "rider" ? (
          <>
            <NavLink to="/rider-deliveries" className="sidebar-option">
              <span style={{ fontSize: '20px', marginRight: '5px' }}>🏍️</span>
              <p>Deliveries</p>
            </NavLink>

            <NavLink to="/rider-earnings" className="sidebar-option">
              <span style={{ fontSize: '20px', marginRight: '5px' }}>💰</span>
              <p>Earnings</p>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className="sidebar-option">
              <span style={{ fontSize: '20px', marginRight: '5px' }}>📊</span>
              <p>Dashboard</p>
            </NavLink>

            <NavLink to="/add" className="sidebar-option">
              <img src={assets.add_icon} alt="" />
              <p>Add Items</p>
            </NavLink>

            <NavLink to="/list" className="sidebar-option">
              <img src={assets.order_icon} alt="" />
              <p>List Items</p>
            </NavLink>

            <NavLink to="/orders" className="sidebar-option">
              <img src={assets.order_icon} alt="" />
              <p>Orders</p>
            </NavLink>

            <NavLink to="/availability" className="sidebar-option">
              <span style={{ fontSize: '20px', marginRight: '5px' }}>📅</span>
              <p>Availability</p>
            </NavLink>
          </>
        )}

        <div onClick={handleLogout} className="sidebar-option sidebar-logout">
          <span style={{ fontSize: '20px', marginRight: '5px' }}>🔑</span>
          <p>Logout</p>
        </div>

      </div>
    </div>
  )
}

export default Sidebar
