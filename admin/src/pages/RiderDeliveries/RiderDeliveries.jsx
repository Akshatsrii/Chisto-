import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
import { toast } from 'react-toastify'
import './RiderDeliveries.css'

const RiderDeliveries = () => {
  const url = "http://localhost:4000"
  const token = localStorage.getItem("admin-token")

  const [unassignedOrders, setUnassignedOrders] = useState([])
  const [assignedOrders, setAssignedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // ================= WEBRTC STATE & REFS =================
  const [socket, setSocket] = useState(null)
  const [activeWebRtcOrder, setActiveWebRtcOrder] = useState(null)
  const [webrtcStatus, setWebrtcStatus] = useState("")
  const localVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    const newSocket = io(url)
    setSocket(newSocket)
    
    newSocket.on("webrtc_answer", async (data) => {
      setWebrtcStatus("Customer joined! Connection established.")
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      }
    })

    newSocket.on("webrtc_ice_candidate", async (data) => {
      if (peerConnectionRef.current && data.candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    })

    return () => {
      newSocket.close()
      stopWebRTC()
    }
  }, [url])

  // ================= REAL GPS TRACKING =================
  const watchIdRef = useRef(null)

  useEffect(() => {
    const hasOutForDelivery = assignedOrders.some(o => o.status === "Out for Delivery")
    
    if (hasOutForDelivery && socket) {
      if (navigator.geolocation && !watchIdRef.current) {
        let lastEmitTime = 0
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const now = Date.now()
            // Throttle to 5 seconds
            if (now - lastEmitTime > 5000) {
              const { latitude: lat, longitude: lng } = position.coords
              const outForDeliveryOrders = assignedOrders.filter(o => o.status === "Out for Delivery")
              
              outForDeliveryOrders.forEach(order => {
                socket.emit("rider_location_update", {
                  orderId: order._id,
                  lat,
                  lng
                })
              })
              lastEmitTime = now
            }
          },
          (err) => console.error("GPS Watch Error:", err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        )
      }
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [assignedOrders, socket])

  const stopWebRTC = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    setActiveWebRtcOrder(null)
    setWebrtcStatus("")
  }

  const startWebRTC = async (orderId) => {
    try {
      setActiveWebRtcOrder(orderId)
      setWebrtcStatus("Starting camera...")
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setWebrtcStatus("Connecting to Customer...")
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      })
      peerConnectionRef.current = pc

      // Add local stream tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // ICE candidates generated locally -> send to Customer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc_ice_candidate", {
            orderId,
            candidate: event.candidate
          })
        }
      }

      // Create Offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      // Emit Offer to Customer
      socket.emit("webrtc_offer", {
        orderId,
        offer
      })
      
      setWebrtcStatus("Ringing customer for verification...")

    } catch (err) {
      console.error(err)
      toast.error("Camera access denied or error occurred")
      stopWebRTC()
    }
  }

  const handleFinishDelivery = () => {
    if (activeWebRtcOrder) {
      socket.emit("webrtc_end", { orderId: activeWebRtcOrder })
      handleUpdateStatus(activeWebRtcOrder, "Delivered")
      stopWebRTC()
    }
  }

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

  // ================= 4. OPTIMIZE ROUTE VIA OSRM TRIP API =================
  const optimizeRoute = async () => {
    const activeOrders = assignedOrders.filter(o => o.status !== "Delivered")
    if (activeOrders.length < 2) {
      toast.info("Need at least 2 active deliveries to optimize route.")
      return
    }

    try {
      setIsOptimizing(true)
      // 1. Get starting point (using the first order's restaurant coords or default)
      let rLat = 28.6139, rLon = 77.2090
      const firstRName = activeOrders[0].items[0]?.restaurantName
      if (firstRName) {
        const res = await axios.get(`${url}/api/restaurant/availability/${firstRName}`)
        if (res.data.success && res.data.data) {
          rLat = res.data.data.latitude || rLat
          rLon = res.data.data.longitude || rLon
        }
      }

      // 2. Build coordinates string: {lon,lat};{lon,lat}...
      // Start with Restaurant, then append all order delivery locations
      const coords = [[rLon, rLat]]
      activeOrders.forEach(o => {
        // use fallback if lat/lon missing
        const dLat = o.address?.lat || rLat + 0.01
        const dLon = o.address?.lon || rLon + 0.01
        coords.push([dLon, dLat])
      })

      const coordsString = coords.map(c => `${c[0]},${c[1]}`).join(';')

      // 3. Call OSRM Trip API
      // source=first means start at the restaurant and then find shortest path through the rest
      // roundtrip=false means we don't have to return to the restaurant at the end
      const osrmUrl = `http://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=false`
      const osrmRes = await axios.get(osrmUrl)

      if (osrmRes.data && osrmRes.data.waypoints) {
        // waypoints array represents the input coordinates
        // waypoints[0] is the restaurant
        // waypoints[1 to N] correspond to activeOrders[0 to N-1]
        // Each waypoint has a `waypoint_index` indicating its position in the optimized trip
        
        const optimizedOrders = [...activeOrders].map((order, idx) => {
          // original index in coords array is idx + 1
          const waypointInfo = osrmRes.data.waypoints[idx + 1]
          return {
            ...order,
            optimalIndex: waypointInfo.waypoint_index
          }
        })

        // Sort ascending by optimalIndex
        optimizedOrders.sort((a, b) => a.optimalIndex - b.optimalIndex)
        
        // Find delivered orders
        const deliveredOrders = assignedOrders.filter(o => o.status === "Delivered")
        
        // Update state
        setAssignedOrders([...optimizedOrders, ...deliveredOrders])
        toast.success("Route Optimized Successfully! 🚀")
      }

    } catch (err) {
      console.error("OSRM Optimize Error", err)
      toast.error("Failed to optimize route. Please try again.")
    } finally {
      setIsOptimizing(false)
    }
  }

  const activeDeliveries = assignedOrders.filter(o => o.status !== "Delivered")

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>📍 My Active Deliveries ({activeDeliveries.length})</h3>
              
              {activeDeliveries.length >= 2 && (
                <button 
                  onClick={optimizeRoute}
                  disabled={isOptimizing}
                  style={{
                    padding: '8px 16px',
                    background: isOptimizing ? '#ccc' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isOptimizing ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {isOptimizing ? "Optimizing..." : "✨ Optimize Route (OSRM)"}
                </button>
              )}
            </div>
            
            {activeDeliveries.length === 0 ? (
              <div className="empty-card">
                <p>No active deliveries. Pick up a new order from the open pool on the right! 🍕</p>
              </div>
            ) : (
              <div className="rider-orders-list">
                {assignedOrders.filter(o => o.status !== "Delivered").map((order, idx) => (
                  <div key={order._id} className="rider-order-card active">
                    <div className="card-header">
                      <div>
                        {activeDeliveries.length > 1 && (
                          <span style={{ 
                            background: '#0c2340', color: 'white', padding: '2px 8px', 
                            borderRadius: '12px', fontSize: '12px', marginRight: '8px', fontWeight: 'bold' 
                          }}>
                            #{idx + 1}
                          </span>
                        )}
                        <span className="order-id">ID: #{order._id.substring(order._id.length - 8)}</span>
                      </div>
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
                          {order.items.map((item, i) => (
                            <span key={i} className="item-tag">
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
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                          <button 
                            className="action-btn"
                            style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white' }}
                            onClick={() => startWebRTC(order._id)}
                          >
                            🎥 Verify Handoff
                          </button>
                          <button 
                            className="action-btn deliver"
                            style={{ flex: 1 }}
                            onClick={() => handleUpdateStatus(order._id, "Delivered")}
                          >
                            ✔ Delivered
                          </button>
                        </div>
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

      {/* WEBRTC MODAL */}
      {activeWebRtcOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '20px', borderRadius: '12px',
            width: '90%', maxWidth: '500px', textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Live Delivery Verification</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>{webrtcStatus}</p>
            
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', borderRadius: '8px', backgroundColor: '#000', marginBottom: '20px' }}
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={stopWebRTC}
                style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleFinishDelivery}
                style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Complete Delivery
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default RiderDeliveries
