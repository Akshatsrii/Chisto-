import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Tag, TrendingUp, Users, PlusCircle, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'

const Coupons = () => {
  const url = "http://localhost:4000"
  const token = localStorage.getItem("admin-token")
  
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    usageLimit: 100,
    expiryDate: "",
    isFirstOrderOnly: false,
    categorySpecific: ""
  })

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${url}/api/coupon/list`, { headers: { token } })
      if (res.data.success) {
        setCoupons(res.data.data)
      }
    } catch (error) {
      toast.error("Error fetching coupons")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchCoupons()
  }, [token])

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${url}/api/coupon/create`, newCoupon, { headers: { token } })
      if (res.data.success) {
        toast.success("Coupon created successfully")
        setNewCoupon({ code: "", discountType: "percentage", discountValue: 10, minOrderAmount: 0, usageLimit: 100, expiryDate: "", isFirstOrderOnly: false, categorySpecific: "" })
        fetchCoupons()
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error("Error creating coupon")
    }
  }

  const handleDeleteCoupon = async (id) => {
    try {
      const res = await axios.delete(`${url}/api/coupon/delete/${id}`, { headers: { token } })
      if (res.data.success) {
        toast.success("Coupon deleted")
        fetchCoupons()
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error("Error deleting coupon")
    }
  }

  // Calculate totals for analytics
  const totalDiscount = coupons.reduce((sum, c) => sum + (c.totalDiscountGiven || 0), 0)
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)

  return (
    <div className="p-6 md:p-10 w-full bg-gray-50 dark:bg-dark-bg min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Coupon Engine & Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your promotional rules and track performance.</p>
      </motion.div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-brand-light/10 text-brand-light dark:bg-blue-500/20 dark:text-blue-400 rounded-full">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Discount Given</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalDiscount}</h2>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400 rounded-full">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Redemptions</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{totalRedemptions} Uses</h2>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400 rounded-full">
            <Tag size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Coupons</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{coupons.filter(c => new Date(c.expiryDate) > new Date()).length}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Coupon Form */}
        <div className="lg:col-span-1 bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6">
            <PlusCircle className="text-brand-light" size={20} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Coupon</h3>
          </div>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Code</label>
              <input required type="text" placeholder="e.g. SUMMER20" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" value={newCoupon.discountType} onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value})}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
                <input required type="number" min="1" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" value={newCoupon.discountValue} onChange={e => setNewCoupon({...newCoupon, discountValue: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Order (₹)</label>
                <input type="number" min="0" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" value={newCoupon.minOrderAmount} onChange={e => setNewCoupon({...newCoupon, minOrderAmount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                <input required type="date" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" value={newCoupon.expiryDate} onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Specific (Optional)</label>
              <input type="text" placeholder="e.g. Desserts" className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" value={newCoupon.categorySpecific} onChange={e => setNewCoupon({...newCoupon, categorySpecific: e.target.value})} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input type="checkbox" className="w-4 h-4 rounded text-brand-light" checked={newCoupon.isFirstOrderOnly} onChange={e => setNewCoupon({...newCoupon, isFirstOrderOnly: e.target.checked})} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Valid for First Order Only</span>
            </label>

            <button type="submit" className="w-full py-3 mt-4 bg-brand-light hover:bg-blue-600 text-white font-bold rounded-lg transition-colors">
              Create Coupon
            </button>
          </form>
        </div>

        {/* Existing Coupons Analytics Table */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Coupon Analytics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Rules</th>
                  <th className="px-4 py-3">Redemptions</th>
                  <th className="px-4 py-3">Value Given</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-4">Loading analytics...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-4">No coupons generated yet.</td></tr>
                ) : coupons.map(c => {
                  const isExpired = new Date(c.expiryDate) < new Date()
                  return (
                    <tr key={c._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">{c.code}</td>
                      <td className="px-4 py-4">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                      <td className="px-4 py-4 text-xs">
                        {c.isFirstOrderOnly && <span className="block text-brand-light">First Order</span>}
                        {c.categorySpecific && <span className="block text-purple-500">{c.categorySpecific}</span>}
                        {c.minOrderAmount > 0 && <span className="block text-gray-400">Min: ₹{c.minOrderAmount}</span>}
                      </td>
                      <td className="px-4 py-4 font-semibold">{c.usedCount}</td>
                      <td className="px-4 py-4 font-semibold text-emerald-600 dark:text-emerald-400">₹{c.totalDiscountGiven || 0}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${isExpired ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleDeleteCoupon(c._id)} className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Coupons
