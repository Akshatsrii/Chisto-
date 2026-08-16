import React, { useContext, useState, useEffect } from "react"
import axios from "axios"
import "./Cart.css"
import { StoreContext } from "../../Context/Storecontext"
import { useNavigate } from "react-router-dom"

const CountdownTimer = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiryDate) - new Date()
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        const seconds = Math.floor((difference / 1000) % 60)
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft("Expired")
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [expiryDate])

  return <span style={{ color: "red", fontWeight: "bold", fontSize: "0.9em" }}>{timeLeft}</span>
}

const Cart = () => {
  const {
    cartItems,
    food_list,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    promoDiscount,
    setPromoDiscount,
    appliedPromo,
    setAppliedPromo,
    socket,
    groupRoomId,
    setGroupRoomId,
    groupMembers
  } = useContext(StoreContext)

  const navigate = useNavigate()
  const [promoInput, setPromoInput] = useState(appliedPromo)
  const [activeCoupons, setActiveCoupons] = useState([])

  const subtotal = getTotalCartAmount()
  
  // Build cart items array for backend validation
  const currentCartItems = food_list
    .filter(item => cartItems[item._id] > 0)
    .map(item => ({ ...item, quantity: cartItems[item._id] }))

  // Fetch active coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await axios.get(`${url}/api/coupon/list`, { headers: { token } })
        if (res.data.success) {
          const valid = res.data.data.filter(c => new Date(c.expiryDate) > new Date())
          setActiveCoupons(valid)
        }
      } catch (error) {
        console.error("Error fetching coupons", error)
      }
    }
    if (token) fetchCoupons()
  }, [token, url])

  // ✅ APPLY PROMO CODE (MANUAL)
  const applyPromoCode = async () => {
    if (!token) return alert("Please login to apply coupons")
    try {
      const res = await axios.post(`${url}/api/coupon/apply`, {
        code: promoInput,
        amount: subtotal,
        cartItems: currentCartItems
      }, { headers: { token } })

      if (res.data.success) {
        setPromoDiscount(res.data.calculatedDiscount)
        setAppliedPromo(promoInput.toUpperCase())
        alert(res.data.message)
      } else {
        setPromoDiscount(0)
        setAppliedPromo("")
        alert(res.data.message)
      }
    } catch (error) {
      alert("Error applying coupon")
    }
  }

  // ✅ AUTO APPLY BEST COUPON
  const autoApplyBestCoupon = async () => {
    if (!token) return alert("Please login to apply coupons")
    try {
      const res = await axios.post(`${url}/api/coupon/auto-apply`, {
        amount: subtotal,
        cartItems: currentCartItems
      }, { headers: { token } })

      if (res.data.success) {
        setPromoDiscount(res.data.calculatedDiscount)
        setAppliedPromo(res.data.code)
        setPromoInput(res.data.code)
        alert(`Successfully applied best coupon: ${res.data.code}`)
      } else {
        alert(res.data.message)
      }
    } catch (error) {
      alert("Error applying best coupon")
    }
  }

  const createGroupCart = () => {
    if (!token) return alert("Please login first to create a group cart")
    const newRoomId = "GRP-" + Math.random().toString(36).substr(2, 6).toUpperCase()
    setGroupRoomId(newRoomId)
    socket.emit("join_group_cart", { roomId: newRoomId, token })
    // copy to clipboard
    const link = `${window.location.origin}/cart?group=${newRoomId}`
    navigator.clipboard.writeText(link)
    alert("Group Cart created! Link copied to clipboard:\n" + link)
  }

  const copyLink = () => {
    const link = `${window.location.origin}/cart?group=${groupRoomId}`
    navigator.clipboard.writeText(link)
    alert("Link copied to clipboard!")
  }

  const finalAmount = Math.max(subtotal - promoDiscount, 0)

  return (
    <div className="cart">
      <div className="cart-items">
        {/* GROUP CART SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>My Cart</h2>
          {!groupRoomId && (
            <button 
              onClick={createGroupCart}
              style={{ padding: '10px 15px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              👥 Start Group Order
            </button>
          )}
        </div>

        {groupRoomId && (
          <div className="group-cart-section" style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ color: '#0369a1', margin: 0 }}>👥 Group Order Active: {groupRoomId}</h2>
              <button onClick={copyLink} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Copy Link</button>
            </div>
            <p style={{ fontSize: '14px', color: '#0c4a6e', marginBottom: '15px' }}>
              Share this link with friends to let them add items: <b>{window.location.origin}/cart?group={groupRoomId}</b>
            </p>
            
            <div className="group-members">
              {Object.entries(groupMembers).map(([userId, data]) => {
                const memberTotal = data.items ? data.items.reduce((sum, it) => sum + (it.price * it.quantity), 0) : 0
                return (
                  <div key={userId} style={{ marginBottom: '10px', padding: '12px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{data.name}</strong>
                      <span style={{ fontWeight: 'bold', color: '#059669' }}>₹{memberTotal}</span>
                    </div>
                    <ul style={{ margin: '8px 0 0 20px', fontSize: '14px', color: '#555' }}>
                      {data.items && data.items.length > 0 ? (
                        data.items.map((item, idx) => (
                          <li key={idx}>{item.name} x {item.quantity} (₹{item.price * item.quantity})</li>
                        ))
                      ) : (
                        <li>No items added yet</li>
                      )}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="cart-items-title">
          <p>Image</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <hr />

        {/* CART ITEMS */}
        {food_list.map((item) => {
          const quantity = cartItems[item._id] || 0
          if (quantity > 0) {
            return (
              <div key={item._id} className="cart-items-item">
                <img src={`${url}/uploads/${item.image}`} alt={item.name} className="cart-item-image" />
                <p>{item.name}</p>
                <p>₹{item.price}</p>
                <p>{quantity}</p>
                <p>₹{item.price * quantity}</p>
                <p className="remove" onClick={() => removeFromCart(item._id)}>X</p>
              </div>
            )
          }
          return null
        })}

        {subtotal === 0 && <p className="cart-empty">Your cart is empty 🛒</p>}
        <hr />

        {/* PROMO CODE SECTION */}
        <div className="promo-section" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          
          <div className="promo-input-container" style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Enter Promo Code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button onClick={applyPromoCode} style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply</button>
            </div>
            
            <button 
              onClick={autoApplyBestCoupon} 
              style={{ width: '100%', padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✨ Auto Apply Best Coupon
            </button>
          </div>

          <div className="active-coupons" style={{ flex: 1, background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>🎟️ Active Coupons</h3>
            {activeCoupons.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeCoupons.map((c) => (
                  <li key={c._id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                    <div>
                      <strong>{c.code}</strong> 
                      <p style={{ margin: '3px 0', fontSize: '12px', color: '#555' }}>
                        {c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`} 
                        {c.minOrderAmount > 0 && ` on orders above ₹${c.minOrderAmount}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '12px' }}>Expires in:</p>
                      <CountdownTimer expiryDate={c.expiryDate} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '13px', color: '#777' }}>No active coupons available right now.</p>
            )}
          </div>
        </div>

        {/* TOTALS */}
        <div className="cart-summary" style={{ marginTop: '30px' }}>
          <p>Subtotal: <span>₹{subtotal}</span></p>
          <p>Discount: <span style={{ color: 'green' }}>-₹{promoDiscount}</span></p>
          <p className="final-total">Total Payable: <span>₹{finalAmount}</span></p>
        </div>

        {/* PROCEED TO CHECKOUT */}
        <button
          className="place-order-btn"
          disabled={finalAmount === 0 || subtotal === 0}
          onClick={() => navigate("/order")}
        >
          Proceed to Checkout
        </button>

      </div>
    </div>
  )
}

export default Cart
