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
  const groupedOrders = React.useMemo(() => {
    const groups = {};
    orders.forEach(o => {
      const key = o.groupId || o._id;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          date: o.date,
          subOrders: [],
          amount: 0,
          payment: o.payment,
          paymentMethod: o.paymentMethod,
          co2Saved: 0,
          items: [],
          address: o.address
        }
      }
      groups[key].subOrders.push(o);
      groups[key].amount += o.amount;
      groups[key].co2Saved += (o.co2Saved || 0);
      groups[key].items.push(...o.items);
    });
    return Object.values(groups).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [orders]);
  const [loading, setLoading] = useState(true)
  
  // Modals state
  const [trackingOrder, setTrackingOrder] = useState(null) // Order object currently being tracked
  const [detailOrder, setDetailOrder] = useState(null)     // Order object currently showing details
  const [mapLoaded, setMapLoaded] = useState(false)
  const [deliveryProgress, setDeliveryProgress] = useState(0)
  const [etaText, setEtaText] = useState("Calculating ETA...")

  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)

  // ================= WEBRTC STATE =================
  const [webrtcOffer, setWebrtcOffer] = useState(null)
  const [webrtcOrderId, setWebrtcOrderId] = useState(null)
  const [webrtcSocket, setWebrtcSocket] = useState(null)
  const peerConnectionRef = useRef(null)
  const remoteVideoRef = useRef(null)

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
    setWebrtcSocket(socket)

    // Join rooms for all user orders to track background changes
    if (orders.length > 0) {
      orders.forEach(o => {
        socket.emit("join_order_room", o._id)
      })
    }

    // Listen for live updates
    socket.on("order_status_update", (data) => {
      setOrders(prev => prev.map(o => o._id === data.orderId ? { ...o, status: data.status } : o))
      
      setTrackingOrder(prev => {
        if (prev && prev._id === data.orderId) {
          return { ...prev, status: data.status }
        }
        return prev
      })

      toast.info(`Order Status updated to: ${data.status} 🚴‍♂️`)
    })

    // Listen for real-time rider GPS updates
    socket.on("rider_location_update", (data) => {
      if (driverMarkerRef.current && driverMarkerRef.current.orderId === data.orderId) {
        driverMarkerRef.current.marker.setLatLng([data.lat, data.lng])
      }
    })

    // WEBRTC SIGNALING
    socket.on("webrtc_offer", (data) => {
      setWebrtcOffer(data.offer)
      setWebrtcOrderId(data.orderId)
    })

    socket.on("webrtc_ice_candidate", async (data) => {
      if (peerConnectionRef.current && data.candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    })

    socket.on("webrtc_end", () => {
      toast.success("Delivery verified! Thank you.")
      stopWebRTC()
    })

    return () => {
      clearInterval(interval)
      socket.disconnect()
      stopWebRTC()
    }
  }, [token, orders.length])

  // ================= WEBRTC FUNCTIONS =================
  const acceptWebRTC = async () => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      })
      peerConnectionRef.current = pc
      
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && webrtcSocket) {
          webrtcSocket.emit("webrtc_ice_candidate", {
             orderId: webrtcOrderId,
             candidate: event.candidate
          })
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(webrtcOffer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      webrtcSocket.emit("webrtc_answer", {
        orderId: webrtcOrderId,
        answer
      })
    } catch (e) {
      console.error(e)
    }
  }

  const stopWebRTC = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    setWebrtcOffer(null)
    setWebrtcOrderId(null)
  }

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
    setEtaText("Calculating ETA...")
  }, [trackingOrder])

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !trackingOrder) return

    const timer = setTimeout(async () => {
      const L = window.L
      if (!L || mapRef.current) return

      // Dynamic Coordinates
      let rLat = 28.6139, rLon = 77.2090; // Default (Delhi)
      try {
        const rName = trackingOrder.items[0]?.restaurantName
        if (rName) {
           const res = await axios.get(`${url}/api/restaurant/availability/${rName}`)
           if (res.data.success && res.data.data) {
             rLat = res.data.data.latitude || rLat
             rLon = res.data.data.longitude || rLon
           }
        }
      } catch(e) { console.error("Error fetching restaurant location", e) }

      const dLat = trackingOrder.address?.lat || rLat + 0.01 // fallback slightly away
      const dLon = trackingOrder.address?.lon || rLon + 0.01

      const restCoords = [rLat, rLon]
      const deliveryCoords = [dLat, dLon]

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
      L.marker(restCoords, { icon: createEmojiIcon("🧑‍🍳", "Kitchen") }).addTo(map)
        .bindPopup(`<b>${trackingOrder.items[0]?.restaurantName || "Kitchen"}</b><br>Kitchen Partner`)
      L.marker(deliveryCoords, { icon: createEmojiIcon("🏠", "Delivery Point") }).addTo(map)
        .bindPopup("<b>Delivery Address</b><br>Customer Location")

      // Add Rider marker (starting at last known location or kitchen)
      const riderLat = trackingOrder.riderLocation?.lat || restCoords[0]
      const riderLng = trackingOrder.riderLocation?.lng || restCoords[1]
      const driverMarker = L.marker([riderLat, riderLng], { icon: createEmojiIcon("🏍️", "Rider") }).addTo(map)
      driverMarkerRef.current = { marker: driverMarker, orderId: trackingOrder._id }

      // ================= OSRM ROUTE OPTIMIZATION =================
      try {
        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${rLon},${rLat};${dLon},${dLat}?overview=full&geometries=geojson`
        const osrmRes = await axios.get(osrmUrl)
        if (osrmRes.data && osrmRes.data.routes && osrmRes.data.routes.length > 0) {
          const route = osrmRes.data.routes[0]
          
          // Draw real road polyline
          L.geoJSON(route.geometry, {
            style: { color: '#3b82f6', weight: 5, opacity: 0.8 } // Beautiful blue
          }).addTo(map)

          // Set Real ETA
          const durationMins = Math.round(route.duration / 60)
          setEtaText(`~ ${durationMins} mins away`)
        } else {
          L.polyline([restCoords, deliveryCoords], { color: '#0c2340', weight: 3, dashArray: '5, 8' }).addTo(map)
          setEtaText("ETA Unavailable")
        }
      } catch (err) {
        console.error("OSRM Route Error", err)
        L.polyline([restCoords, deliveryCoords], { color: '#0c2340', weight: 3, dashArray: '5, 8' }).addTo(map)
        setEtaText("ETA Unavailable")
      }

      const group = new L.featureGroup([
        L.marker(restCoords),
        L.marker(deliveryCoords)
      ])
      map.fitBounds(group.getBounds(), { padding: [40, 40] })
    }, 200)

    return () => clearTimeout(timer)
  }, [mapLoaded, trackingOrder])

  // ETA updates (optional polling could go here if needed)
  useEffect(() => {
    if (!trackingOrder) return
    const status = trackingOrder.status || "Food Processing"

    if (status === "Delivered") {
      setEtaText("Arrived")
    }
  }, [trackingOrder])

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

  const totalCo2Saved = orders.reduce((sum, order) => sum + (order.co2Saved || 0), 0)

  return (
    <div className="my-orders">
      <div className="my-orders-header">
        <h2>My Orders Listing</h2>
        <p>View, track, and reorder from your order history</p>
      </div>

      {totalCo2Saved > 0 && (
        <div className="co2-saved-banner" style={{ background: '#dcfce7', color: '#166534', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '24px' }}>🌿</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Your Green Impact</h3>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'normal' }}>You have saved <b>{totalCo2Saved.toFixed(1)}g</b> of CO2 emissions by choosing eco-friendly deliveries! 🌎</p>
          </div>
        </div>
      )}

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
          {groupedOrders.map((group) => {
            return (
              <div key={group.id} className="my-orders-order">
                {/* Parcel Icon */}
                <div className="parcel-icon-wrapper">
                  <img src={assets.parcel_icon} alt="Parcel" />
                </div>

                {/* Items Summary */}
                <div className="order-items-info">
                  <p className="order-items-title">Items Ordered</p>
                  <p className="order-items-list">
                    {group.items.map((item, index) =>
                      index === group.items.length - 1
                        ? `${item.name} x ${item.quantity}`
                        : `${item.name} x ${item.quantity}, `
                    )}
                  </p>
                  
                  {group.co2Saved > 0 && (
                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #a7f3d0' }}>
                      🌿 {group.co2Saved.toFixed(1)}g CO2 Saved (Green Score: A+)
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="order-amount-info">
                  <p className="meta-label">Amount Paid</p>
                  <p className="order-amount">₹{group.amount}</p>
                </div>

                {/* Status Indicator */}
                <div className="order-status-info">
                  <p className="meta-label">Status</p>
                  <div className="status-badge-container" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className={group.payment ? "paid-badge" : "pending-badge"}>
                      {group.payment ? "Paid (Online)" : "COD"}
                    </span>
                    {group.subOrders.map(sub => {
                      const statusClass = (sub.status || "Food Processing").replace(/\s+/g, '-').toLowerCase()
                      return (
                        <div key={sub._id} className="status-live-tracking" style={{ marginTop: '4px' }}>
                          <span className={`status-dot ${statusClass}`}>●</span>
                          <small className="tracking-text" style={{ fontSize: '11px' }}>
                            {group.subOrders.length > 1 ? `${sub.items[0]?.restaurantName || 'Restaurant'}: ` : ''}{sub.status || "Food Processing"}
                          </small>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Date */}
                <div className="order-date-info">
                  <p className="meta-label">Order Date</p>
                  <p className="order-date">{new Date(group.date).toLocaleDateString()}</p>
                </div>

                {/* Responsive Action Buttons */}
                <div className="order-actions-grid">
                  <button className="view-details-btn" onClick={() => setDetailOrder(group)}>
                    Receipt 📄
                  </button>

                  {/* Show Track Map button for active prep/delivery orders */}
                  {group.subOrders.some(sub => ["Food Processing", "Out for Delivery", "Payment Verification Pending"].includes(sub.status)) ? (
                    <button className="track-map-btn" onClick={() => {
                        const activeSub = group.subOrders.find(sub => ["Food Processing", "Out for Delivery", "Payment Verification Pending"].includes(sub.status)) || group.subOrders[0];
                        setTrackingOrder(activeSub);
                    }}>
                      Track Live 📍
                    </button>
                  ) : (
                    <button className="reorder-btn" onClick={() => handleReorder(group.items)}>
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
                {!mapLoaded && <p style={{ textAlign: "center", padding: "40px" }}>Loading Live Tracking Map...</p>}
              </div>

              {/* Status Tracker */}
              <div className="modal-status-tracker">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p>Status: <span className="highlight-text">{trackingOrder.status}</span></p>
                  <p style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '1.1em' }}>{etaText}</p>
                </div>
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
                <p><b>Order ID:</b> {detailOrder.id}</p>
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

      {/* ================= WEBRTC INCOMING CALL MODAL ================= */}
      {webrtcOffer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '24px', borderRadius: '16px',
            width: '90%', maxWidth: '500px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>📹 Live Handoff Verification</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>Your rider wants to verify the delivery condition live.</p>
            
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!remoteVideoRef.current?.srcObject && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                  Waiting to accept...
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={stopWebRTC}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Decline
              </button>
              <button 
                onClick={acceptWebRTC}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Accept Video
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default MyOrders
