import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './Dashboard.css'

const Dashboard = () => {
  const url = "https://food-ordering-6lji.onrender.com"
  const token = localStorage.getItem("admin-token")
  const restaurantName = localStorage.getItem("admin-restaurantName")
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalItems: 0,
    avgOrderValue: 0,
    cancellationRate: 0,
    repeatCustomers: 0,
    topFoods: [],
    categorySales: {}
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch foods
      const foodRes = await axios.get(`${url}/api/food/list`)
      // Fetch orders
      const orderRes = await axios.get(`${url}/api/order/list`, {
        headers: { token }
      })

      if (orderRes.data.success && foodRes.data.success) {
        const orders = orderRes.data.data
        const foods = foodRes.data.data

        // Calculate statistics
        const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)
        const totalOrders = orders.length
        const activeOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
        const cancellationRate = totalOrders > 0 ? Math.round((orders.filter(o => o.status === "Cancelled").length / totalOrders) * 100) : 0

        // Repeat customers count
        const customerCounts = {}
        orders.forEach(o => {
          customerCounts[o.userId] = (customerCounts[o.userId] || 0) + 1
        })
        const repeatCustomers = Object.values(customerCounts).filter(c => c > 1).length

        // Top selling foods
        const foodMap = {}
        orders.forEach(o => {
          o.items.forEach(it => {
            foodMap[it.name] = (foodMap[it.name] || 0) + it.quantity
          })
        })
        const topFoods = Object.entries(foodMap)
          .sort((a,b) => b[1] - a[1])
          .slice(0, 4)
          .map(entry => ({ name: entry[0], count: entry[1] }))

        // Category-wise sales
        const catMap = {}
        orders.forEach(o => {
          o.items.forEach(it => {
            const cat = it.category || "Other"
            catMap[cat] = (catMap[cat] || 0) + (it.price * it.quantity)
          })
        })

        // Filter food count by restaurant
        const adminRole = localStorage.getItem("admin-role")
        const currentRestName = localStorage.getItem("admin-restaurantName")
        const restaurantItems = adminRole === "admin" ? foods : foods.filter(f => f.restaurantName === currentRestName)

        setStats({
          totalRevenue,
          totalOrders,
          activeOrders,
          totalItems: restaurantItems.length,
          avgOrderValue,
          cancellationRate,
          repeatCustomers,
          topFoods,
          categorySales: catMap
        })

        // Recent 5 orders
        setRecentOrders(orders.slice(0, 5))
      }
    } catch (error) {
      console.log("Error loading dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    }
  }, [token])

  if (loading) {
    return <div className="dashboard-loading">Loading Dashboard Metrics...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome Back, {restaurantName}!</h1>
        <p>Here is what's happening at your restaurant today.</p>
      </div>

      {/* Advanced Stats Cards Row */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-icon rev">₹</div>
          <div className="stat-info">
            <span className="stat-title">Total Revenue</span>
            <h2 className="stat-val">₹{stats.totalRevenue}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">📦</div>
          <div className="stat-info">
            <span className="stat-title">Total Orders</span>
            <h2 className="stat-val">{stats.totalOrders}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon avg">💳</div>
          <div className="stat-info">
            <span className="stat-title">Avg Order Value</span>
            <h2 className="stat-val">₹{stats.avgOrderValue}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cancel">❌</div>
          <div className="stat-info">
            <span className="stat-title">Cancellation Rate</span>
            <h2 className="stat-val">{stats.cancellationRate}%</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon loyal">👥</div>
          <div className="stat-info">
            <span className="stat-title">Repeat Customers</span>
            <h2 className="stat-val">{stats.repeatCustomers}</h2>
          </div>
        </div>
      </div>

      {/* Charts / Advanced Analytics Row */}
      <div className="dashboard-analytics-row">
        
        {/* TOP SELLING FOOD ITEMS */}
        <div className="dashboard-chart-container">
          <h3>🔥 Top Selling Dishes</h3>
          <div className="top-selling-list">
            {stats.topFoods.length > 0 ? (
              stats.topFoods.map((item, idx) => (
                <div key={idx} className="top-food-item">
                  <div className="rank-badge">#{idx+1}</div>
                  <div className="food-info">
                    <strong>{item.name}</strong>
                    <span>{item.count} orders placed</span>
                  </div>
                  <div className="food-progress-bar">
                    <div className="fill" style={{ width: `${Math.min((item.count / 10) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No sales data compiled yet.</p>
            )}
          </div>
        </div>

        {/* CATEGORY SALES SUMMARY */}
        <div className="dashboard-recent-orders">
          <h3>📊 Sales by Category</h3>
          <div className="category-sales-list">
            {Object.keys(stats.categorySales).length > 0 ? (
              Object.entries(stats.categorySales).map(([cat, amount], idx) => (
                <div key={idx} className="category-sale-row">
                  <div className="cat-header">
                    <span className="cat-name">{cat}</span>
                    <span className="cat-amt">₹{amount}</span>
                  </div>
                  <div className="category-bar">
                    <div className="fill" style={{ width: `${Math.min((amount / (stats.totalRevenue || 1)) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No category data compiled yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* RECENT ORDERS ROW */}
      <div className="dashboard-analytics-row">
        {/* Recent Orders List */}
        <div className="dashboard-recent-orders" style={{ flex: 1 }}>
          <h3>Recent Orders</h3>
          <div className="recent-orders-list">
            {recentOrders.length > 0 ? (
              recentOrders.map((ord, idx) => (
                <div key={idx} className="recent-order-item">
                  <div className="ord-dot"></div>
                  <div className="ord-details">
                    <p className="ord-items-text">
                      {ord.items.map(it => `${it.name} x${it.quantity}`).join(', ')}
                    </p>
                    <span className="ord-amount">₹{ord.amount}</span>
                  </div>
                  <span className={`ord-status ${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {ord.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-recent-orders">No orders recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
