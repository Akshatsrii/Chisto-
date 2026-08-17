import React, { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import "./Orders.css"

const Orders = () => {
  const [orders, setOrders] = useState([])
  const url = import.meta.env.VITE_BACKEND_URL || "https://food-ordering-6lji.onrender.com"
  const token = localStorage.getItem("admin-token")

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`, {
        headers: { token }
      })
      if (response.data.success) {
        setOrders(response.data.data)
      } else {
        toast.error("Failed to load orders")
      }
    } catch (error) {
      console.log(error)
      toast.error("Error loading orders")
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await axios.post(
        `${url}/api/order/status`,
        { orderId, status: newStatus },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success("Order status updated successfully!")
        fetchOrders()
      } else {
        toast.error(response.data.message || "Failed to update status")
      }
    } catch (error) {
      console.log(error)
      toast.error("Error updating status")
    }
  }

  useEffect(() => {
    if (token) {
      fetchOrders()
    }
  }, [token])

  return (
    <div className="orders-page">
      <h2>Live Orders Management</h2>

      {orders.length > 0 ? (
        orders.map((order) => (
          <div key={order._id} className="order-card">
            {/* Box Icon representing order package */}
            <img 
              src="https://cdn-icons-png.flaticon.com/512/679/679720.png" 
              alt="order" 
              className="order-icon" 
            />

            <div className="order-info">
              {/* ITEMS */}
              <p className="order-items">
                {order.items.map((item, i) => (
                  <span key={i}>
                    {item.name} x {item.quantity}
                    <span style={{ fontSize: '11.5px', color: '#0c2340', fontWeight: 'bold' }}> ({item.restaurantName || "Chisto Kitchen"})</span>
                    {i < order.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>

              {/* ADDRESS */}
              <p className="order-user-name">Customer: {order.address.firstName} {order.address.lastName}</p>
              <p className="order-address-text">{order.address.street}</p>
              <p className="order-address-text">
                {order.address.city}, {order.address.state},{" "}
                {order.address.country} - {order.address.zip}
              </p>

              {/* PHONE */}
              <p className="order-phone">Phone: {order.address.phone}</p>

              {/* META */}
              <div className="order-meta-info">
                <span>Items : {order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                <span className="order-total-amount">₹{order.amount}</span>
                <span className={`payment-badge ${order.payment ? 'paid' : 'unpaid'}`}>
                  {order.payment ? 'Paid Online' : 'Cash on Delivery (Pending)'}
                </span>
              </div>

              {/* DATE & SCHEDULE */}
              <p className="order-date-text">
                Ordered On: {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>

              {order.isScheduled && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#fff9e6', border: '1px solid #ffd54f', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#ff8f00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⏱️</span> 
                    Scheduled For: {new Date(order.scheduledDate).toLocaleDateString()}
                  </p>
                  {order.travelDetails && (
                    <p style={{ margin: '5px 0 0 0', color: '#424242', fontSize: '14px', paddingLeft: '26px' }}>
                      <strong>{order.travelDetails.type} Journey:</strong> {order.travelDetails.pnrOrFlightNumber}
                    </p>
                  )}
                </div>
              )}

              {/* STATUS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                <select
                  value={order.status}
                  className="status-dropdown"
                  onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                  style={{ marginTop: 0 }}
                >
                  <option value="Scheduled (Awaiting Date)">Scheduled (Awaiting Date)</option>
                  <option value="Payment Verification Pending">Payment Verification Pending</option>
                  <option value="Food Processing">Food Processing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                {order.status === "Payment Verification Pending" && (
                  <button
                    className="verify-payment-btn"
                    onClick={() => handleStatusUpdate(order._id, "Food Processing")}
                    style={{
                      background: '#2e7d32',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#1b5e20'}
                    onMouseOut={(e) => e.target.style.background = '#2e7d32'}
                  >
                    Verify Payment & Confirm Order
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="no-orders-message">No live orders found.</p>
      )}
    </div>
  )
}

export default Orders

