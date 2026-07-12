import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './RiderEarnings.css'

const RiderEarnings = () => {
  const url = "http://localhost:4000"
  const token = localStorage.getItem("admin-token")

  const [stats, setStats] = useState({
    deliveredCount: 0,
    totalEarnings: 0,
    orders: []
  })
  const [loading, setLoading] = useState(true)

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${url}/api/order/earnings`, {
        headers: { token }
      })
      if (res.data.success) {
        setStats({
          deliveredCount: res.data.deliveredCount,
          totalEarnings: res.data.totalEarnings,
          orders: res.data.orders
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load earnings stats")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchEarnings()
    }
  }, [token])

  return (
    <div className="rider-earnings">
      <div className="rider-header">
        <h2>💰 Rider Earnings Dashboard</h2>
        <p>Monitor your deliveries milestones and total payroll summaries</p>
      </div>

      {loading ? (
        <div className="rider-loading">
          <div className="spinner"></div>
          <p>Calculating payroll history...</p>
        </div>
      ) : (
        <div className="earnings-container">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon">🏍️</div>
              <div className="stat-info">
                <h3>Total Delivered</h3>
                <span className="stat-val">{stats.deliveredCount} Orders</span>
              </div>
            </div>

            <div className="stat-card payout">
              <div className="stat-icon">💸</div>
              <div className="stat-info">
                <h3>Total Earnings</h3>
                <span className="stat-val">₹{stats.totalEarnings}</span>
              </div>
            </div>

            <div className="stat-card rate">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Earning Rate</h3>
                <span className="stat-val">₹50 / Delivery</span>
              </div>
            </div>
          </div>

          {/* DELIVERED ORDERS HISTORY */}
          <div className="earnings-history-section">
            <h3>📜 Completed Deliveries Log</h3>
            
            {stats.orders.length === 0 ? (
              <div className="empty-history-card">
                <p>No completed deliveries logged yet. Go complete assignments to earn payouts! 🏍️</p>
              </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Destination City</th>
                      <th>Amount Collected</th>
                      <th>Your Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.orders.map((order) => (
                      <tr key={order._id}>
                        <td className="bold-cell">#{order._id.substring(order._id.length - 8)}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>{order.address.city}, {order.address.state}</td>
                        <td className="amount-cell">₹{order.amount}</td>
                        <td className="earnings-cell">+₹50.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default RiderEarnings
