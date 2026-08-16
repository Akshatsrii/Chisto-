import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, animate } from 'framer-motion'
import { DollarSign, Package, CreditCard, XCircle, Users, TrendingUp } from 'lucide-react'

// Animated Number Component
const AnimatedNumber = ({ value, prefix = "", suffix = "" }) => {
  const nodeRef = React.useRef(null)

  useEffect(() => {
    const node = nodeRef.current
    if (node) {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate(value) {
          node.textContent = `${prefix}${Math.round(value).toLocaleString()}${suffix}`
        }
      })
      return () => controls.stop()
    }
  }, [value, prefix, suffix])

  return <span ref={nodeRef}>{prefix}0{suffix}</span>
}

const Dashboard = () => {
  const url = "http://localhost:4000"
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
    categorySales: {},
    totalCo2Saved: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [weatherSurge, setWeatherSurge] = useState({ isRainForecasted: false, surgeFee: 0 })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const foodRes = await axios.get(`${url}/api/food/list`)
      const orderRes = await axios.get(`${url}/api/order/list`, {
        headers: { token }
      })

      if (orderRes.data.success && foodRes.data.success) {
        const orders = orderRes.data.data
        const foods = foodRes.data.data

        const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)
        const totalOrders = orders.length
        const activeOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
        const cancellationRate = totalOrders > 0 ? Math.round((orders.filter(o => o.status === "Cancelled").length / totalOrders) * 100) : 0

        const customerCounts = {}
        orders.forEach(o => { customerCounts[o.userId] = (customerCounts[o.userId] || 0) + 1 })
        const repeatCustomers = Object.values(customerCounts).filter(c => c > 1).length

        const foodMap = {}
        orders.forEach(o => {
          o.items.forEach(it => { foodMap[it.name] = (foodMap[it.name] || 0) + it.quantity })
        })
        const topFoods = Object.entries(foodMap)
          .sort((a,b) => b[1] - a[1]).slice(0, 4).map(entry => ({ name: entry[0], count: entry[1] }))

        const catMap = {}
        orders.forEach(o => {
          o.items.forEach(it => {
            const cat = it.category || "Other"
            catMap[cat] = (catMap[cat] || 0) + (it.price * it.quantity)
          })
        })

        const totalCo2Saved = orders.reduce((sum, order) => sum + (order.co2Saved || 0), 0)

        const adminRole = localStorage.getItem("admin-role")
        const currentRestName = localStorage.getItem("admin-restaurantName") || "Admin"
        const restaurantItems = adminRole === "admin" ? foods : foods.filter(f => f.restaurantName === currentRestName)

        // Fetch weather
        try {
          const wRes = await axios.get(`${url}/api/restaurant/availability/${currentRestName}`)
          if (wRes.data.success && wRes.data.data) {
             setWeatherSurge({
               isRainForecasted: wRes.data.data.isRainForecasted,
               surgeFee: wRes.data.data.surgeFee
             })
          }
        } catch(e) { console.log(e) }

        // Fetch Referral Analytics if admin
        let refAnalytics = null
        if (adminRole === 'admin') {
          try {
            const rRes = await axios.get(`${url}/api/user/referral-analytics`, { headers: { token } })
            if (rRes.data.success) {
              refAnalytics = rRes.data
            }
          } catch(e) { console.log(e) }
        }

        setStats({
          totalRevenue, totalOrders, activeOrders, totalItems: restaurantItems.length,
          avgOrderValue, cancellationRate, repeatCustomers, topFoods, categorySales: catMap,
          totalCo2Saved,
          referralData: refAnalytics
        })
        setRecentOrders(orders.slice(0, 5))
      }
    } catch (error) {
      console.log("Error loading dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchDashboardData()
  }, [token])

  // Variants for staggered entrance
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }

  if (loading) {
    return (
      <div className="p-6 md:p-10 w-full animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-dark-border rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-1/3 mb-10"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-dark-border rounded-2xl"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-dark-border rounded-2xl lg:col-span-2"></div>
          <div className="h-80 bg-gray-200 dark:bg-dark-border rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 w-full bg-gray-50 dark:bg-dark-bg min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back, {restaurantName || "Admin"}!</h1>
        <p className="text-gray-500 dark:text-gray-400">Here's what's happening with your store today.</p>
        
        {weatherSurge.isRainForecasted && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full text-red-600">🚨</div>
            <div>
              <h4 className="text-red-700 font-bold">Expected Demand Spike (High Alert)</h4>
              <p className="text-red-600 text-sm">Rain is forecasted in your delivery zone. A dynamic surge fee of ₹{weatherSurge.surgeFee} is active.</p>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Bento Stat Card 1 */}
        <motion.div variants={item} className="bg-white dark:bg-dark-card/60 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
              <DollarSign className="text-brand-light dark:text-blue-400" size={24} />
            </div>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Revenue</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber value={stats.totalRevenue} prefix="₹" />
            </h2>
          </div>
        </motion.div>

        {/* Bento Stat Card 2 */}
        <motion.div variants={item} className="bg-white dark:bg-dark-card/60 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl">
              <Package className="text-purple-500 dark:text-purple-400" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Orders</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber value={stats.totalOrders} />
            </h2>
          </div>
        </motion.div>

        {/* Bento Stat Card 3 */}
        <motion.div variants={item} className="bg-white dark:bg-dark-card/60 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-2xl">
              <CreditCard className="text-orange-500 dark:text-orange-400" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Avg Order Value</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber value={stats.avgOrderValue} prefix="₹" />
            </h2>
          </div>
        </motion.div>

        {/* Bento Stat Card 4 */}
        <motion.div variants={item} className="bg-white dark:bg-dark-card/60 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
              <Users className="text-rose-500 dark:text-rose-400" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Repeat Customers</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber value={stats.repeatCustomers} />
            </h2>
          </div>
        </motion.div>
      </motion.div>

      {/* Complex Bento Layout for Analytics */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* City-Wide Sustainability Metrics (Green Score) - Full Width */}
        <motion.div variants={item} className="lg:col-span-3 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl border border-emerald-400 shadow-sm text-white flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">🌿 City-Wide Sustainability Metrics</h3>
            <p className="text-emerald-100 text-sm max-w-xl">By using EV and scooter riders, our platform tracks and reduces carbon footprint on every delivery. Here is our community impact so far!</p>
          </div>
          <div className="mt-4 md:mt-0 text-right bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
            <p className="text-emerald-50 text-sm font-medium mb-1">Total CO2 Emissions Saved</p>
            <h2 className="text-4xl font-black">
              <AnimatedNumber value={stats.totalCo2Saved} suffix=" g" />
            </h2>
          </div>
        </motion.div>
      </motion.div>

      {/* REFERRAL ANALYTICS */}
      {stats.referralData && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 mb-8">
          <motion.div variants={item} className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-sm flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🚀 Growth & Referral Analytics</h3>
              <p className="text-indigo-100 text-sm">Viral Coefficient tracks how many new users are brought in by existing users.</p>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-indigo-200">Viral Coefficient</p>
                  <p className="text-2xl font-black">{stats.referralData.viralCoefficient}x</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-indigo-200">Referred Users</p>
                  <p className="text-2xl font-black">{stats.referralData.totalReferred}</p>
                </div>
              </div>
            </div>
            
            {stats.referralData.topReferrers?.length > 0 && (
              <div className="mt-6 md:mt-0 bg-white/10 p-4 rounded-2xl backdrop-blur-sm w-full md:w-auto">
                <p className="text-sm font-bold mb-2 text-indigo-50">Top Referrers</p>
                <div className="space-y-2">
                  {stats.referralData.topReferrers.map((ref, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-white/10 pb-1">
                      <span>{ref.name} ({ref.code})</span>
                      <span className="font-bold">{ref.referrals} referred</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Selling Dish - Spans 2 Cols */}
        <motion.div variants={item} className="lg:col-span-2 bg-white dark:bg-dark-card/60 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-brand-light" size={20} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Selling Dishes</h3>
          </div>
          
          <div className="space-y-5">
            {stats.topFoods.length > 0 ? stats.topFoods.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                    <span className="text-sm text-gray-500">{item.count} orders</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min((item.count / 10) * 100, 100)}%` }} 
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-brand-light dark:bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm">No sales data compiled yet.</p>}
          </div>
        </motion.div>

        {/* Recent Orders - Spans 1 Col */}
        <motion.div variants={item} className="bg-white dark:bg-dark-card/60 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {recentOrders.length > 0 ? recentOrders.map((ord, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-brand-light dark:hover:border-brand-blue transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900 dark:text-white">₹{ord.amount}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'}`}>
                    {ord.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                </p>
              </div>
            )) : <p className="text-gray-500 text-sm">No recent orders.</p>}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Dashboard
