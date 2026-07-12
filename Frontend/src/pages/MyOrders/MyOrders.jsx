import React, { useContext, useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { io } from "socket.io-client"
import axios from "axios"
import "./MyOrders.css"
import { StoreContext } from "../../Context/Storecontext"
import { assets } from "../../assets/assets"

const MyOrders = () => {
  const { token, url, addToCart } = useContext(StoreContext)
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modals state
  const [trackingOrder, setTrackingOrder] = useState(null) // Order object currently being tracked
  const [detailOrder, setDetailOrder] = useState(null)     // Order object currently showing details
  const [mapLoaded, setMapLoaded] = useState(false)
  const [deliveryProgress, setDeliveryProgress] = useState(0)

  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)
  
  const restCoords = [26.9124, 75.7873]
  const deliveryCoords = [26.9215, 75.7985]

  // ================= 1. FETCH USER ORDERS =================
  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        `${url}/api/order/user`,
        { headers: { token } }
      )
      if (response.data.success) {
        setOrders(response.data.data)
        
        // If map modal is open, update trackingOrder details in real-time
        if (trackingOrder) {
          const updated = response.data.data.find(o => o._id === trackingOrder._id)
          if (updated) {
            setTrackingOrder(updated)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user orders:", error)
    } finally {
      setLoading(false)
    }
  }

  // Socket listener & polling fallback
  useEffect(() => {
    if (!token) return

    fetchOrders()
    const interval = setInterval(fetchOrders, 12000) // Fallback list refresh

    const socket = io(url)

    // Join rooms for all user orders to track background changes
    if (orders.length > 0) {
      orders.forEach(o => {
        socket.emit("join_order_room", o._id)
      })
    }

    // Listen for live updates
    socket.on("order_status_update", (data) => {
      // Update local orders list state
      setOrders(prev => prev.map(o => o._id === data.orderId ? { ...o, status: data.status } : o))
      
      // Update active map tracker modal state
      setTrackingOrder(prev => {
        if (prev && prev._id === data.orderId) {
          return { ...prev, status: data.status }
        }
        return prev
      })

      toast.info(`Order Status updated to: ${data.status} 🚴‍♂️`)
    })

    return () => {
      clearInterval(interval)
      socket.disconnect()
    }
  }, [token, orders.length])

  // ================= 2. LOAD LEAFLET ON TRACKING MODAL =================
  useEffect(() => {
    if (!trackingOrder) {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      return
    }

    setMapLoaded(true)
  }, [trackingOrder])

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !trackingOrder) return

    const timer = setTimeout(() => {
      const L = window.L
      if (!L || mapRef.current) return

      // Initialize map inside modal-map container
      const map = L.map("modal-tracking-map").setView(restCoords, 13)
      mapRef.current = map

      // Force Leaflet recalculation for correct rendering inside modal
      setTimeout(() => {
        map.invalidateSize()
      }, 100)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      const createEmojiIcon = (emoji, label) => {
        return L.divIcon({
          html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" title="${label}">${emoji}</div>`,
          iconSize: [35, 35],
          iconAnchor: [17, 30]
        })
      }

      // Add markers
      L.marker(restCoords, { icon: createEmojiIcon("🧑‍🍳", "Chisto Kitchen") }).addTo(map)
        .bindPopup("<b>Chisto Kitchen</b><br>Kitchen Partner")
      L.marker(deliveryCoords, { icon: createEmojiIcon("🏠", "Delivery Point") }).addTo(map)
        .bindPopup("<b>Delivery Address</b><br>Customer Location")

      // Polyline path
      L.polyline([restCoords, deliveryCoords], {
        color: '#0c2340',
        weight: 3,
        dashArray: '5, 8',
        opacity: 0.8
      }).addTo(map)

      // Add Rider marker
      const driverMarker = L.marker(restCoords, { icon: createEmojiIcon("🏍️", "Rider") }).addTo(map)
      driverMarkerRef.current = driverMarker

      const group = new L.featureGroup([
        L.marker(restCoords),
        L.marker(deliveryCoords)
      ])
      map.fitBounds(group.getBounds(), { padding: [40, 40] })
    }, 200)

    return () => clearTimeout(timer)
  }, [mapLoaded, trackingOrder])

  // Rider Marker Animation
  useEffect(() => {
    if (!trackingOrder) return
    const status = trackingOrder.status || "Food Processing"

    if (status !== "Out for Delivery") {
      setDeliveryProgress(status === "Delivered" ? 100 : 0)
      return
    }

    const interval = setInterval(() => {
      setDeliveryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 4
      })
    }, 400)

    return () => clearInterval(interval)
  }, [trackingOrder])

  // Coordinate updates
  useEffect(() => {
    if (!driverMarkerRef.current) return
    const lat = restCoords[0] + (deliveryCoords[0] - restCoords[0]) * (deliveryProgress / 100)
    const lng = restCoords[1] + (deliveryCoords[1] - restCoords[1]) * (deliveryProgress / 100)
    driverMarkerRef.current.setLatLng([lat, lng])
  }, [deliveryProgress])

  // ================= 3. ORDER AGAIN FEATURE =================
  const handleReorder = async (orderItems) => {
    try {
      for (const item of orderItems) {
        await addToCart(item._id)
      }
      toast.success("Items added to cart! 🛒")
      navigate("/cart")
    } catch (err) {
      console.error(err)
      toast.error("Failed to reorder items")
    }
  }

  if (loading) {
    return (
      <div className="my-orders-loading">
        <div className="loader-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    )
  }

  return (
    <div className="my-orders">
      <div className="my-orders-header">
        <h2>My Orders Listing</h2>
        <p>View, track, and reorder from your order history</p>
      </div>

      {/* 🛍️ PREMIUM EMPTY STATE */}
      {orders.length === 0 ? (
        <div className="premium-empty-state">
          <div className="empty-icon-circle">🛍️</div>
          <h3>No Orders Placed Yet</h3>
          <p>
            Explore our diverse menu featuring a delectable array of dishes. 
            Choose your favorite foods and order now!
          </p>
          <button className="empty-explore-btn" onClick={() => navigate("/")}>
            Explore Delicious Menu
          </button>
        </div>
      ) : (
        <div className="container">
          {orders.map((order) => {
            const orderStatus = order.status || "Food Processing"
            const statusClass = orderStatus.replace(/\s+/g, '-').toLowerCase()

            return (
              <div key={order._id} className="my-orders-order">
                {/* Parcel Icon */}
                <div className="parcel-icon-wrapper">
                  <img src={assets.parcel_icon} alt="Parcel" />
                </div>

                {/* Items Summary */}
                <div className="order-items-info">
                  <p className="order-items-title">Items Ordered</p>
                  <p className="order-items-list">
                    {order.items.map((item, index) =>
                      index === order.items.length - 1
                        ? `${item.name} x ${item.quantity}`
                        : `${item.name} x ${item.quantity}, `
                    )}
                  </p>
                </div>

                {/* Amount */}
                <div className="order-amount-info">
                  <p className="meta-label">Amount Paid</p>
                  <p className="order-amount">₹{order.amount}</p>
                </div>

                {/* Status Indicator */}
                <div className="order-status-info">
                  <p className="meta-label">Status</p>
                  <div className="status-badge-container">
                    <span className={order.payment ? "paid-badge" : "pending-badge"}>
                      {order.payment ? "Paid (Online)" : "COD"}
                    </span>
                    <div className="status-live-tracking">
                      <span className={`status-dot ${statusClass}`}>●</span>
                      <small className="tracking-text"> {orderStatus}</small>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="order-date-info">
                  <p className="meta-label">Order Date</p>
                  <p className="order-date">{new Date(order.date).toLocaleDateString()}</p>
                </div>

                {/* Responsive Action Buttons */}
                <div className="order-actions-grid">
                  <button className="view-details-btn" onClick={() => setDetailOrder(order)}>
                    Receipt 📄
                  </button>

                  {/* Show Track Map button for active prep/delivery orders */}
                  {(orderStatus === "Food Processing" || orderStatus === "Out for Delivery" || orderStatus === "Payment Verification Pending") ? (
                    <button className="track-map-btn" onClick={() => setTrackingOrder(order)}>
                      Track Live 📍
                    </button>
                  ) : (
                    // Show reorder button for completed/cancelled orders
                    <button className="reorder-btn" onClick={() => handleReorder(order.items)}>
                      Order Again 🔄
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ================= MAP TRACKING MODAL ================= */}
      {trackingOrder && (
        <div className="modal-overlay" onClick={() => setTrackingOrder(null)}>
          <div className="modal-card map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📍 Track Live Order</h3>
              <button className="close-modal-btn" onClick={() => setTrackingOrder(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div id="modal-tracking-map">
                {!mapLoaded && <p style={{ textAlign: "center", padding: "40px" }}>Loading Live Rider Tracking Map...</p>}
              </div>

              {/* Status Tracker */}
              <div className="modal-status-tracker">
                <p>Status: <span className="highlight-text">{trackingOrder.status}</span></p>
                <div className="tracker-steps">
                  <div className="step done">✓ Confirmed</div>
                  <div className={`step ${trackingOrder.status !== "Payment Verification Pending" ? "done" : ""}`}>🍳 Prep</div>
                  <div className={`step ${trackingOrder.status === "Out for Delivery" || trackingOrder.status === "Delivered" ? "done" : ""}`}>🏍️ Transit</div>
                  <div className={`step ${trackingOrder.status === "Delivered" ? "done" : ""}`}>🎁 Arrived</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= RECEIPT DETAILS MODAL ================= */}
      {detailOrder && (
        <div className="modal-overlay" onClick={() => setDetailOrder(null)}>
          <div className="modal-card detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Order Receipt Summary</h3>
              <button className="close-modal-btn" onClick={() => setDetailOrder(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="receipt-section">
                <p><b>Order ID:</b> {detailOrder._id}</p>
                <p><b>Date:</b> {new Date(detailOrder.date).toLocaleString()}</p>
                <p><b>Payment Type:</b> {detailOrder.paymentMethod || (detailOrder.payment ? "Stripe Checkout" : "Cash on Delivery")}</p>
              </div>
              <hr />
              
              <div className="receipt-items">
                <h4>Items Breakdown:</h4>
                <ul>
                  {detailOrder.items.map((item, idx) => (
                    <li key={idx} className="receipt-item-row">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <hr />

              <div className="receipt-address">
                <h4>Delivery Address:</h4>
                <p>{detailOrder.address?.firstName} {detailOrder.address?.lastName}</p>
                <p>{detailOrder.address?.street}, {detailOrder.address?.city}</p>
                <p>{detailOrder.address?.state}, {detailOrder.address?.zipcode}</p>
                <p><b>Phone:</b> {detailOrder.address?.phone}</p>
              </div>
              <hr />

              <div className="receipt-totals">
                <div className="row"><span>Subtotal</span><span>₹{detailOrder.amount - 40}</span></div>
                <div className="row"><span>Delivery Fee</span><span>₹40</span></div>
                <div className="row grand-total"><span>Grand Total</span><span>₹{detailOrder.amount}</span></div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="close-btn-footer" onClick={() => setDetailOrder(null)}>Close Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrders
