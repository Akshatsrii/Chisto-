import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
import { toast } from 'react-toastify'
import './RiderDeliveries.css'

const RiderDeliveries = () => {
  const url = "http://localhost:4000"
  const token = localStorage.getItem("admin-token")

  const [isOnline, setIsOnline] = useState(true)
  const [activeTab, setActiveTab] = useState("Available")

  const [unassignedOrders, setUnassignedOrders] = useState([])
  const [assignedOrders, setAssignedOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // ================= WEBRTC STATE & REFS =================
  const [socket, setSocket] = useState(null)
  const [activeWebRtcOrder, setActiveWebRtcOrder] = useState(null)
  const [webrtcStatus, setWebrtcStatus] = useState("")
  const localVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const streamRef = useRef(null)

  // ================= MAP REFS =================
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)

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
  const [riderCoords, setRiderCoords] = useState(null)

  useEffect(() => {
    const hasOutForDelivery = assignedOrders.some(o => o.status === "Out for Delivery")
    
    if (hasOutForDelivery && socket) {
      if (navigator.geolocation && !watchIdRef.current) {
        let lastEmitTime = 0
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const now = Date.now()
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            setRiderCoords([lat, lng])
            
            // Throttle to 5 seconds
            if (now - lastEmitTime > 5000) {
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

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc_ice_candidate", {
            orderId,
            candidate: event.candidate
          })
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      socket.emit("webrtc_offer", {
        orderId,
        offer
      })
      
      setWebrtcStatus("Ringing customer for verification...")

    } catch (err) {
      console.error(err)
      toast.error("Camera access denied")
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

  const fetchData = async () => {
    if (!isOnline) return;
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
        
        // Auto switch tab if active orders exist
        if (resAssigned.data.data.filter(o => o.status !== "Delivered").length > 0) {
           setActiveTab("Active")
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchData()
  }, [token, isOnline])

  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await axios.post(`${url}/api/order/accept`, { orderId }, {
        headers: { token }
      })
      if (res.data.success) {
        toast.success("Order accepted! 🏍️")
        setActiveTab("Active")
        fetchData()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      console.error(err)
      toast.error("Error accepting order")
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.post(`${url}/api/order/rider-status`, {
        orderId,
        status: newStatus
      }, {
        headers: { token }
      })
      if (res.data.success) {
        toast.success(`Updated to: ${newStatus} 🎉`)
        fetchData()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      console.error(err)
      toast.error("Error updating status")
    }
  }

  const activeDeliveries = assignedOrders.filter(o => o.status !== "Delivered")
  const outForDelivery = activeDeliveries.find(o => o.status === "Out for Delivery")

  // ================= MAP INITIALIZATION (IMMERSIVE VIEW) =================
  useEffect(() => {
    if (outForDelivery && activeTab === "Active") {
      const timer = setTimeout(async () => {
        const L = window.L
        if (!L || !mapContainerRef.current) return
        
        if (!mapRef.current) {
          const map = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 13)
          mapRef.current = map

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap'
          }).addTo(map)

          // Fetch coords
          let rLat = 28.6139, rLon = 77.2090;
          try {
            const rName = outForDelivery.items[0]?.restaurantName
            if (rName) {
               const res = await axios.get(`${url}/api/restaurant/availability/${rName}`)
               if (res.data.success && res.data.data) {
                 rLat = res.data.data.latitude || rLat
                 rLon = res.data.data.longitude || rLon
               }
            }
          } catch(e) {}

          const dLat = outForDelivery.address?.lat || rLat + 0.01
          const dLon = outForDelivery.address?.lon || rLon + 0.01
          
          const createEmojiIcon = (emoji) => {
            return L.divIcon({
              html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${emoji}</div>`,
              iconSize: [35, 35],
              iconAnchor: [17, 30]
            })
          }

          L.marker([rLat, rLon], { icon: createEmojiIcon("🧑‍🍳") }).addTo(map)
          L.marker([dLat, dLon], { icon: createEmojiIcon("🏠") }).addTo(map)
          
          if (riderCoords) {
             L.marker(riderCoords, { icon: createEmojiIcon("🏍️") }).addTo(map)
          }

          // Route
          try {
            const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${rLon},${rLat};${dLon},${dLat}?overview=full&geometries=geojson`
            const osrmRes = await axios.get(osrmUrl)
            if (osrmRes.data && osrmRes.data.routes && osrmRes.data.routes.length > 0) {
              const route = osrmRes.data.routes[0]
              L.geoJSON(route.geometry, { style: { color: '#3b82f6', weight: 5, opacity: 0.8 } }).addTo(map)
            } else {
              L.polyline([[rLat, rLon], [dLat, dLon]], { color: '#0c2340', weight: 3, dashArray: '5, 8' }).addTo(map)
            }
          } catch(e) {}

          const group = new L.featureGroup([L.marker([rLat, rLon]), L.marker([dLat, dLon])])
          map.fitBounds(group.getBounds(), { padding: [40, 40] })
          
          setTimeout(() => map.invalidateSize(), 300)
        }
      }, 500)
      return () => clearTimeout(timer)
    } else {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [outForDelivery, activeTab])

  return (
    <div className="rider-deliveries">
      
      {/* TOP BAR */}
      <div className="rider-top-bar">
        <h3 style={{ margin: 0, fontWeight: 700, color: '#0c2340' }}>Chisto Rider</h3>
        <div 
          className={`rider-status-toggle ${isOnline ? 'online' : 'offline'}`}
          onClick={() => setIsOnline(!isOnline)}
        >
          {isOnline ? (
             <><div className="status-dot-pulse"></div><span>Online</span></>
          ) : (
             <><div style={{width:'12px', height:'12px', borderRadius:'50%', background:'#ef4444'}}></div><span>Offline</span></>
          )}
        </div>
      </div>

      {!isOnline ? (
        <div className="offline-state">
          <div className="offline-icon">😴</div>
          <h2>You are offline</h2>
          <p>Go online to start receiving delivery requests.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      ) : (
        <>
          {activeTab === "Available" && (
            <div className="rider-content-mobile">
              <h2 className="rider-section-title">Open Pool ({unassignedOrders.length})</h2>
              {unassignedOrders.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px', color:'#a0aec0'}}>
                  No new delivery requests right now. Check back soon!
                </div>
              ) : (
                unassignedOrders.map(order => (
                  <div key={order._id} className="mobile-order-card">
                    <div className="card-header-mobile">
                      <span className="order-badge available">New Request</span>
                      <strong style={{color:'#4a5568'}}>₹{Math.round(order.amount * 0.1) || 50} Earn</strong>
                    </div>
                    <div className="card-body-mobile">
                      <div className="info-block">
                        <div className="icon">🧑‍🍳</div>
                        <div>
                          <h4>Pickup From</h4>
                          <p>{order.items[0]?.restaurantName || "Chisto Kitchen"}</p>
                        </div>
                      </div>
                      <div className="info-block">
                        <div className="icon">🏠</div>
                        <div>
                          <h4>Deliver To</h4>
                          <p>{order.address.city}, {order.address.state}</p>
                        </div>
                      </div>
                    </div>
                    <button className="mobile-action-btn accept" onClick={() => handleAcceptOrder(order._id)}>
                      Accept Delivery
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "Active" && (
            outForDelivery ? (
              <div className="active-delivery-immersive">
                <div className="immersive-map-container">
                   <div id="rider-live-map" ref={mapContainerRef}></div>
                </div>
                <div className="immersive-drawer">
                  <div className="drawer-pull"></div>
                  <div className="card-header-mobile">
                    <span className="order-badge">Active Delivery</span>
                    <strong style={{color:'#2b6cb0'}}>Collect: ₹{outForDelivery.amount}</strong>
                  </div>
                  
                  <div className="info-block">
                    <div className="icon">🏠</div>
                    <div>
                      <h4>Dropoff Address</h4>
                      <p>{outForDelivery.address.street}, {outForDelivery.address.city}</p>
                      <p style={{color:'#718096', fontSize:'13px', fontWeight:'normal'}}>{outForDelivery.address.firstName} {outForDelivery.address.lastName} • {outForDelivery.address.phone}</p>
                    </div>
                  </div>

                  <div className="immersive-actions">
                    <button className="mobile-action-btn verify" onClick={() => startWebRTC(outForDelivery._id)}>
                      🎥 Verify
                    </button>
                    <button className="mobile-action-btn deliver" onClick={() => handleUpdateStatus(outForDelivery._id, "Delivered")}>
                      ✔ Mark Delivered
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rider-content-mobile">
                <h2 className="rider-section-title">My Assignments ({activeDeliveries.length})</h2>
                {activeDeliveries.length === 0 ? (
                  <div style={{textAlign:'center', padding:'40px', color:'#a0aec0'}}>
                    You have no active assignments. Check Available pool.
                  </div>
                ) : (
                  activeDeliveries.map(order => (
                    <div key={order._id} className="mobile-order-card" style={{borderLeft: '4px solid #f59e0b'}}>
                      <div className="card-header-mobile">
                        <span className="order-badge" style={{background:'#fffaf0', color:'#dd6b20'}}>Processing</span>
                        <strong style={{color:'#4a5568'}}>ID: #{order._id.substring(order._id.length - 6)}</strong>
                      </div>
                      <div className="card-body-mobile">
                        <div className="info-block">
                          <div className="icon">🧑‍🍳</div>
                          <div>
                            <h4>Pickup From</h4>
                            <p>{order.items[0]?.restaurantName || "Chisto Kitchen"}</p>
                          </div>
                        </div>
                        <div className="info-block">
                          <div className="icon">🏠</div>
                          <div>
                            <h4>Deliver To</h4>
                            <p>{order.address.street}, {order.address.city}</p>
                          </div>
                        </div>
                      </div>
                      <button className="mobile-action-btn pickup" onClick={() => handleUpdateStatus(order._id, "Out for Delivery")}>
                        Mark Picked Up
                      </button>
                    </div>
                  ))
                )}
              </div>
            )
          )}

          {activeTab === "Earnings" && (
            <div className="earnings-placeholder">
              <h2>Total Earnings</h2>
              <h1>₹{assignedOrders.filter(o => o.status === "Delivered").reduce((sum, o) => sum + (Math.round(o.amount * 0.1) || 50), 0)}</h1>
              <p>From {assignedOrders.filter(o => o.status === "Delivered").length} completed deliveries.</p>
            </div>
          )}
        </>
      )}

      {/* BOTTOM NAV BAR */}
      <div className="rider-bottom-nav">
        <button className={`nav-tab ${activeTab === 'Available' ? 'active' : ''}`} onClick={() => setActiveTab('Available')}>
          <div className="nav-icon">📥</div>
          Available
        </button>
        <button className={`nav-tab ${activeTab === 'Active' ? 'active' : ''}`} onClick={() => setActiveTab('Active')}>
          <div className="nav-icon">🏍️</div>
          Active
        </button>
        <button className={`nav-tab ${activeTab === 'Earnings' ? 'active' : ''}`} onClick={() => setActiveTab('Earnings')}>
          <div className="nav-icon">💰</div>
          Earnings
        </button>
      </div>

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
