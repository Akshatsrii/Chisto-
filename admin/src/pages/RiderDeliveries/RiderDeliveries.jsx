import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './RiderDeliveries.css'

const RiderDeliveries = () => {
  const url = "http://localhost:4000"
  const token = localStorage.getItem("admin-token")

  const [unassignedOrders, setUnassignedOrders] = useState([])
  const [assignedOrders, setAssignedOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all rider-related orders
  const fetchData = async () => {
    try {
      setLoading(true)
      const resUnassigned = await axios.get(`${url}/api/order/unassigned`, {
        headers: { token }
      })
      const resAssigned = await axios.get(`${url}/api/order/assigned`, {
        headers: { token }
      })

      if (resUnassigned.data.success) {
        setUnassignedOrders(resUnassigned.data.data)
      }
      if (resAssigned.data.success) {
        setAssignedOrders(resAssigned.data.data)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  // Accept Order handler
  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await axios.post(`${url}/api/order/accept`, { orderId }, {
        headers: { token }
      })
      if (res.data.success) {
        toast.success("Order accepted successfully! 🏍️")
        fetchData()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      console.error(err)
      toast.error("Error accepting order")
    }
  }

  // Update Status handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.post(`${url}/api/order/rider-status`, {
        orderId,
        status: newStatus
      }, {
        headers: { token }
      })
      if (res.data.success) {
        toast.success(`Order status updated to: ${newStatus} 🎉`)
        fetchData()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      console.error(err)
      toast.error("Error updating status")
    }
  }

  return (
    <div className="rider-deliveries">
      <div className="rider-header">
        <h2>🏍️ Rider Delivery Dashboard</h2>
        <p>Manage active delivery assignments and accept new requests</p>
      </div>

      {loading ? (
        <div className="rider-loading">
          <div className="spinner"></div>
          <p>Loading delivery pool...</p>
        </div>
      ) : (
        <div className="rider-content-grid">
          
          {/* ASSIGNED/ACTIVE ORDERS */}
          <div className="rider-section active-orders-section">
            <h3>📍 My Active Deliveries ({assignedOrders.filter(o => o.status !== "Delivered").length})</h3>
            
            {assignedOrders.filter(o => o.status !== "Delivered").length === 0 ? (
              <div className="empty-card">
                <p>No active deliveries. Pick up a new order from the open pool on the right! 🍕</p>
              </div>
            ) : (
              <div className="rider-orders-list">
                {assignedOrders.filter(o => o.status !== "Delivered").map((order) => (
                  <div key={order._id} className="rider-order-card active">
                    <div className="card-header">
                      <span className="order-id">ID: #{order._id.substring(order._id.length - 8)}</span>
                      <span className={`status-pill ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="card-body">
                      <div className="info-row">
                        <strong>Restaurant Name:</strong>
                        <span>{order.items[0]?.restaurantName || "Chisto Kitchen"}</span>
                      </div>
                      
                      <div className="info-row">
                        <strong>Items:</strong>
                        <span>
                          {order.items.map((item, idx) => (
                            <span key={idx} className="item-tag">
                              {item.name} x {item.quantity}
                            </span>
                          ))}
                        </span>
                      </div>

                      <div className="info-row">
                        <strong>Delivery Address:</strong>
                        <span>
                          {order.address.street}, {order.address.city}, {order.address.state} - {order.address.zip}
                        </span>
                      </div>

                      <div className="info-row">
                        <strong>Customer Name/Phone:</strong>
                        <span>{order.address.firstName} {order.address.lastName} ({order.address.phone})</span>
                      </div>

                      <div className="info-row amount-row">
                        <strong>Cash to Collect:</strong>
                        <span className="amount-value">₹{order.amount}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      {order.status === "Food Processing" && (
                        <button 
                          className="action-btn pickup"
                          onClick={() => handleUpdateStatus(order._id, "Out for Delivery")}
                        >
                          📦 Pick Up Order
                        </button>
                      )}
                      {order.status === "Out for Delivery" && (
                        <button 
                          className="action-btn deliver"
                          onClick={() => handleUpdateStatus(order._id, "Delivered")}
                        >
                          ✔ Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OPEN DELIVERY POOL (UNASSIGNED) */}
          <div className="rider-section open-pool-section">
            <h3>📥 Open Delivery Pool ({unassignedOrders.length})</h3>
            
            {unassignedOrders.length === 0 ? (
              <div className="empty-card">
                <p>No new delivery requests in the pool right now. Check back soon!</p>
              </div>
            ) : (
              <div className="rider-orders-list">
                {unassignedOrders.map((order) => (
                  <div key={order._id} className="rider-order-card unassigned">
                    <div className="card-header">
                      <span className="order-id">ID: #{order._id.substring(order._id.length - 8)}</span>
                      <span className="pool-badge">Available</span>
                    </div>

                    <div className="card-body">
                      <div className="info-row">
                        <strong>Restaurant:</strong>
                        <span>{order.items[0]?.restaurantName || "Chisto Kitchen"}</span>
                      </div>

                      <div className="info-row">
                        <strong>Delivery Destination:</strong>
                        <span>{order.address.city}, {order.address.state}</span>
                      </div>

                      <div className="info-row">
                        <strong>Est. Earnings:</strong>
                        <span className="earning-est">₹50.00</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button 
                        className="action-btn accept"
                        onClick={() => handleAcceptOrder(order._id)}
                      >
                        🏍️ Accept Delivery
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default RiderDeliveries

