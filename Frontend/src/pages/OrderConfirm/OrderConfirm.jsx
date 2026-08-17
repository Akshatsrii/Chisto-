import React, { useEffect, useState, useRef, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { io } from "socket.io-client"
import axios from "axios"
import "./OrderConfirm.css"
import { StoreContext } from "../../Context/Storecontext"

const OrderConfirm = () => {
  const navigate = useNavigate()
  const { url, token } = useContext(StoreContext)
  
  const [mapLoaded, setMapLoaded] = useState(false)
  const [orderStatus, setOrderStatus] = useState("Food Processing")
  const [paymentPaid, setPaymentPaid] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const [etaText, setEtaText] = useState("Calculating ETA...")
  
  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)
  
  // Read orderId from URL search query parameter
  const orderId = new URLSearchParams(window.location.search).get("orderId")

  // ================= 1. SOCKET LISTEN & POLL INITIAL STATUS =================
  useEffect(() => {
    if (!token || !orderId) return

    // Connect to backend socket
    const socket = io(url)

    // Join room for this specific order
    socket.emit("join_order_room", orderId)

    // Listen for live status broadcast
    socket.on("order_status_update", (data) => {
      if (data.orderId === orderId) {
        setOrderStatus(data.status)
        toast.info(`Order status updated to: ${data.status} 🚴‍♂️`)
      }
    })

    // Listen for real-time rider GPS updates
    socket.on("rider_location_update", (data) => {
      if (data.orderId === orderId && driverMarkerRef.current) {
        driverMarkerRef.current.marker.setLatLng([data.lat, data.lng])
      }
    })

    const fetchOrderStatus = async () => {
      try {
        const response = await axios.get(`${url}/api/order/user`, {
          headers: { token }
        })
        if (response.data.success) {
          const currentOrder = response.data.data.find(o => o._id === orderId)
          if (currentOrder) {
            setOrderStatus(currentOrder.status)
            setPaymentPaid(currentOrder.payment)
            setOrderData(currentOrder)
          }
        }
      } catch (err) {
        console.error("Error fetching order status:", err)
      }
    }

    fetchOrderStatus() // get initial status on load

    return () => {
      socket.disconnect()
    }
  }, [token, orderId, url])

  // ================= 2. SET MAP LOADED STATE =================
  useEffect(() => {
    // Show success notification once mounted
    toast.success("Order Registered Successfully! 🍕🔥")
    setMapLoaded(true)
  }, [])

  // ================= 3. INITIALIZE MAP & DYNAMIC ROUTE =================
  useEffect(() => {
    if (!mapLoaded || !orderData) return

    const timer = setTimeout(async () => {
      const L = window.L
      if (!L || mapRef.current) return

      // Dynamic Coordinates
      let rLat = 28.6139, rLon = 77.2090; // Default
      try {
        const rName = orderData.items[0]?.restaurantName
        if (rName) {
           const res = await axios.get(`${url}/api/restaurant/availability/${rName}`)
           if (res.data.success && res.data.data) {
             rLat = res.data.data.latitude || rLat
             rLon = res.data.data.longitude || rLon
           }
        }
      } catch(e) { console.error("Error fetching restaurant location", e) }

      const dLat = orderData.address?.lat || rLat + 0.01
      const dLon = orderData.address?.lon || rLon + 0.01

      const restCoords = [rLat, rLon]
      const deliveryCoords = [dLat, dLon]

      // Initialize Map on order-confirm-map div
      const map = L.map("order-confirm-map").setView(restCoords, 13)
      mapRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      // Custom icon wrapper helpers
      const createEmojiIcon = (emoji, label) => {
        return L.divIcon({
          html: `<div style="font-size: 32px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3)); text-align: center;" title="${label}">${emoji}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 35],
          popupAnchor: [0, -35]
        })
      }

      // Add pins
      const restMarker = L.marker(restCoords, { icon: createEmojiIcon("🧑‍🍳", "Chisto Kitchen") }).addTo(map)
        .bindPopup(`<b>${orderData.items[0]?.restaurantName || "Kitchen"}</b><br>Cooking your hot meal!`)
        .openPopup()

      const userMarker = L.marker(deliveryCoords, { icon: createEmojiIcon("🏠", "Your Address") }).addTo(map)
        .bindPopup("<b>Your Address</b><br>Safe Delivery Spot")

      // Add initial Delivery Boy motorcycle marker at last known location or restaurant
      const riderLat = orderData.riderLocation?.lat || restCoords[0]
      const riderLng = orderData.riderLocation?.lng || restCoords[1]
      const driverMarker = L.marker([riderLat, riderLng], { icon: createEmojiIcon("🏍️", "Delivery Boy") }).addTo(map)
        .bindPopup("<b>Chisto Rider</b><br>On the way to deliver food.")
      driverMarkerRef.current = { marker: driverMarker, orderId: orderId }

      // ================= OSRM ROUTE OPTIMIZATION =================
      try {
        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${rLon},${rLat};${dLon},${dLat}?overview=full&geometries=geojson`
        const osrmRes = await axios.get(osrmUrl)
        if (osrmRes.data && osrmRes.data.routes && osrmRes.data.routes.length > 0) {
          const route = osrmRes.data.routes[0]
          
          L.geoJSON(route.geometry, {
            style: { color: '#3b82f6', weight: 5, opacity: 0.8 } // Beautiful blue
          }).addTo(map)

          const durationMins = Math.round(route.duration / 60)
          setEtaText(`~ ${durationMins} mins away`)
        } else {
          L.polyline([restCoords, deliveryCoords], { color: '#0c2340', weight: 4, dashArray: '6, 10', opacity: 0.8 }).addTo(map)
          setEtaText("ETA Unavailable")
        }
      } catch (err) {
        console.error("OSRM Route Error", err)
        L.polyline([restCoords, deliveryCoords], { color: '#0c2340', weight: 4, dashArray: '6, 10', opacity: 0.8 }).addTo(map)
        setEtaText("ETA Unavailable")
      }

      // Zoom to fit markers
      const group = new L.featureGroup([restMarker, userMarker])
      map.fitBounds(group.getBounds(), { padding: [50, 50] })

    }, 200)

    return () => clearTimeout(timer)
  }, [mapLoaded, orderData])

  // ================= 4. ETA AND STATUS FALLBACKS =================
  useEffect(() => {
    if (orderStatus === "Delivered") {
      setEtaText("Arrived")
      if (driverMarkerRef.current) {
        driverMarkerRef.current.marker.setPopupContent("<b>Chisto Rider</b><br>Arrived at your location! 🍕🎉")
      }
    } else if (orderStatus === "Out for Delivery") {
      if (driverMarkerRef.current) {
         driverMarkerRef.current.marker.setPopupContent(`<b>Chisto Rider</b><br>Out for delivery toward you.`)
      }
    } else {
      if (driverMarkerRef.current) {
         driverMarkerRef.current.marker.setPopupContent("<b>Chisto Rider</b><br>Waiting for preparation to complete.")
      }
    }
  }, [orderStatus])

  return (
    <div className="order-confirm">
      <div className="order-confirm-box">
        {/* Animated Checkmark Icon */}
        <div className="checkmark-circle">
          <div className="background"></div>
          <div className="checkmark draw"></div>
        </div>

        <h1>🎉 Order Confirmed!</h1>
        <p className="order-success-sub">Your order has been registered in our database.</p>

        {/* Live Status Tracker */}
        <div className="status-tracker-container">
          <div className="status-step active">
            <span className="step-badge">✔</span>
            <p>Confirmed</p>
          </div>
          <div className={`status-line ${(orderStatus !== "Payment Verification Pending") ? "active" : ""}`}></div>
          
          <div className={`status-step ${(orderStatus !== "Payment Verification Pending") ? "active" : ""} ${(orderStatus === "Food Processing") ? "pulsing" : ""}`}>
            <span className="step-badge">🍳</span>
            <p>Preparing</p>
          </div>
          <div className={`status-line ${(orderStatus === "Out for Delivery" || orderStatus === "Delivered") ? "active" : ""}`}></div>
          
          <div className={`status-step ${(orderStatus === "Out for Delivery" || orderStatus === "Delivered") ? "active" : ""} ${(orderStatus === "Out for Delivery") ? "pulsing" : ""}`}>
            <span className="step-badge">🚴‍♂️</span>
            <p>On The Way</p>
          </div>
          <div className={`status-line ${(orderStatus === "Delivered") ? "active" : ""}`}></div>

          <div className={`status-step ${(orderStatus === "Delivered") ? "active" : ""}`}>
            <span className="step-badge">🎁</span>
            <p>Delivered</p>
          </div>
        </div>

        {/* Informative text depending on status */}
        <div className="status-message-banner">
          {orderStatus === "Payment Verification Pending" && (
            <p className="banner-msg warning">💳 <b>Stripe Payment Verification Pending:</b> Order will begin preparing once Admin approves.</p>
          )}
          {orderStatus === "Food Processing" && (
            <p className="banner-msg success">🔥 <b>Cooking:</b> The chef is currently cooking your hot food in the kitchen!</p>
          )}
          {orderStatus === "Out for Delivery" && (
            <p className="banner-msg info">🚴‍♂️ <b>Out for Delivery:</b> Chisto Rider has picked up your parcel and is traveling toward you!</p>
          )}
          {orderStatus === "Delivered" && (
            <p className="banner-msg success">🎉 <b>Arrived:</b> Rider has safely reached your address. Bon Appetit!</p>
          )}
          {orderStatus === "Cancelled" && (
            <p className="banner-msg danger">❌ <b>Order Cancelled:</b> This order has been cancelled by the operator.</p>
          )}
        </div>

        {/* Leaflet Map Card Container */}
        <div className="live-delivery-map-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>📍 Live Rider Tracking</h3>
            <span className="order-live-status-pill">{orderStatus}</span>
          </div>
          <div id="order-confirm-map">
            {(!mapLoaded || !orderData) && <p className="loading-map">Initializing live tracking map...</p>}
          </div>
          <div className="driver-eta-text">
            <span>Rider ETA: <b style={{ color: '#f59e0b' }}>{orderStatus === "Delivered" ? "Arrived" : etaText}</b></span>
            <span>Status: <b>{orderStatus}</b></span>
          </div>
        </div>

        <div className="order-confirm-actions">
          <button className="primary-btn" onClick={() => navigate("/myorders")}>
            View My Orders
          </button>
          <button className="secondary-btn" onClick={() => navigate("/")}>
            Order More Food
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirm
