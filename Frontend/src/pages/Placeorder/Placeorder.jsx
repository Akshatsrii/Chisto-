import React, { useContext, useState, useEffect, useRef } from "react"
import axios from "axios"
import "./Placeorder.css"
import { StoreContext } from "../../Context/Storecontext"
import { useNavigate } from "react-router-dom"
import * as turf from "@turf/turf"
import { saveOrderOffline } from "../../utils/idb"
import { toast } from "react-toastify"

const PlaceOrder = () => {

  const navigate = useNavigate()

  const {
    cartItems,
    food_list,
    getTotalCartAmount,
    token,
    url,
    promoDiscount,
    appliedPromo,
    groupRoomId,
    groupPaymentLinks,
    socket
  } = useContext(StoreContext)

  const [splitType, setSplitType] = useState("Even Split")

  const getUserId = () => {
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.id
    } catch(e) { return null }
  }
  const myUserId = getUserId()

  // DELIVERY FORM STATE
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: ""
  })

  // LOCATION & NOMINATIM STATE
  const [lat, setLat] = useState(null)
  const [lon, setLon] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  const searchTimeout = useRef(null)

  // PAYMENT METHOD STATE
  const [paymentMethod, setPaymentMethod] = useState("COD")

  // SCHEDULING STATE
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [travelDetails, setTravelDetails] = useState({
    type: "Train",
    pnrOrFlightNumber: ""
  })

  // WEATHER SURGE STATE
  const [weatherCondition, setWeatherCondition] = useState("Clear")
  const [surgeFee, setSurgeFee] = useState(0)

  useEffect(() => {
    const fetchWeather = async () => {
      const restaurantNames = [...new Set(orderItems.map(item => item.restaurantName))]
      if (restaurantNames.length > 0) {
        try {
          const res = await axios.post(`${url}/api/restaurant/availability/multiple`, { restaurantNames })
          if (res.data.success && res.data.weatherInfo) {
            setWeatherCondition(res.data.weatherInfo.isRainForecasted ? "Rain" : "Clear")
            setSurgeFee(res.data.weatherInfo.surgeFee || 0)
          }
        } catch (err) {}
      }
    }
    fetchWeather()
  }, [cartItems])

  // HANDLE FORM INPUT
  const onChangeHandler = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value })
  }

  // BUILD ORDER ITEMS
  const orderItems = food_list
    .filter(item => cartItems[item._id] > 0)
    .map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      quantity: cartItems[item._id],
      restaurantId: item.restaurantId,
      restaurantName: item.restaurantName || "Chisto Kitchen",
      image: item.image
    }))

  const deliveryFee = getTotalCartAmount() === 0 ? 0 : (40 + surgeFee)
  const totalAmount = Math.max(getTotalCartAmount() + deliveryFee - promoDiscount, 0)

  // ==============================
  // LOCATION AUTOCOMPLETE
  // ==============================
  
  const handleAddressSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&email=contact@chisto.com`)
        setSuggestions(res.data)
      } catch (error) {
        console.error("Geocoding error", error)
      } finally {
        setIsSearching(false)
      }
    }, 500)
  }

  const fillAddressFromOSM = (data) => {
    setLat(parseFloat(data.lat))
    setLon(parseFloat(data.lon))
    setSearchQuery(data.display_name)
    setSuggestions([])

    const addr = data.address || {}
    setAddress(prev => ({
      ...prev,
      street: addr.road || addr.suburb || addr.neighbourhood || data.name || "",
      city: addr.city || addr.town || addr.village || addr.state_district || "",
      state: addr.state || "",
      zip: addr.postcode || "",
      country: addr.country || ""
    }))
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }
    
    setIsSearching(true)
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&email=contact@chisto.com`)
        if (res.data) {
          fillAddressFromOSM(res.data)
        }
      } catch (error) {
        console.error("Reverse geocoding error", error)
        alert("Failed to get address from location")
      } finally {
        setIsSearching(false)
      }
    }, (error) => {
      alert("Location access denied or failed.")
      setIsSearching(false)
    })
  }

  // ==============================
  // PLACE ORDER
  // ==============================

  const placeOrder = async (e) => {
    e.preventDefault()

    if (!token) {
      alert("Please login first")
      return
    }

    if (orderItems.length === 0) {
      alert("Cart is empty")
      return
    }

    if (!lat || !lon) {
      alert("Please select a valid address from the search suggestions or use 'My Location' so we can verify delivery zones.")
      return
    }

    // 🔴 OFFLINE HANDLING
    if (!navigator.onLine) {
      if (paymentMethod !== "COD") {
        alert("You are offline. Only Cash on Delivery is supported offline.")
        return
      }
      
      const offlineOrder = {
        items: orderItems,
        amount: totalAmount,
        address: { ...address, lat, lon },
        paymentMethod: "COD",
        isScheduled,
        scheduledDate,
        travelDetails,
        couponCode: appliedPromo,
        discountAmount: promoDiscount,
        distance: 5, // fallback for offline
        surgeFee,
        weatherCondition
      }
      
      await saveOrderOffline(offlineOrder)
      toast.info("📶 You are offline. Your order is queued and will be placed automatically when internet connects.", { autoClose: 5000 })
      navigate('/cart')
      return
    }

    // 🔥 VALIDATE AVAILABILITY & DELIVERY ZONES
    let orderDistance = 5 // fallback
    const restaurantNames = [...new Set(orderItems.map(item => item.restaurantName))]
    try {
      const settingsRes = await axios.post(`${url}/api/restaurant/availability/multiple`, { restaurantNames })
      if (settingsRes.data.success) {
        const rMap = settingsRes.data.data
        for (const rName of restaurantNames) {
          const rData = rMap[rName] || {}
          
          // 1. Availability Date Check
          if (isScheduled && scheduledDate) {
            const unavDates = rData.unavailableDates || []
            if (unavDates.includes(scheduledDate)) {
              alert(`Sorry! ${rName} is closed on ${new Date(scheduledDate).toLocaleDateString()}. Please select another date or order now.`)
              return // Block Checkout
            }
          }

          // 2. Delivery Zone Radius Check
          if (rData.latitude && rData.longitude) {
            const distance = turf.distance(
              turf.point([lon, lat]),
              turf.point([rData.longitude, rData.latitude]),
              { units: 'kilometers' }
            )
            orderDistance = distance // store for backend
            const maxRadius = rData.maxDeliveryRadius || 5 // default 5km

            if (distance > maxRadius) {
              alert(`Checkout Blocked: Your address is ${distance.toFixed(1)} km away from ${rName}. They only deliver within ${maxRadius} km.`)
              return // Block Checkout
            }
          }
        }
      }
    } catch (err) {
      console.log("Error checking restaurant settings:", err)
    }

    try {
      // 🟣 GROUP ORDERING CHECKOUT (SOCKET)
      if (groupRoomId) {
        if (paymentMethod === "COD") {
           alert("Group orders must be paid online to support split billing.")
           return
        }
        socket.emit("checkout_group_cart", {
          roomId: groupRoomId,
          token,
          address: { ...address, lat, lon },
          distance: orderDistance,
          splitType,
          surgeFee,
          weatherCondition
        })
        return // Wait for group_payment_links socket event
      }

      // 🟢 CASH ON DELIVERY (REST API)
      if (paymentMethod === "COD") {
        const response = await axios.post(
          `${url}/api/order/place`,
          {
            items: orderItems,
            amount: totalAmount,
            address: { ...address, lat, lon },
            paymentMethod: "COD",
            isScheduled,
            scheduledDate,
            travelDetails,
            couponCode: appliedPromo,
            discountAmount: promoDiscount,
            distance: orderDistance,
            surgeFee,
            weatherCondition
          },
          { headers: { token } }
        )

        if (response.data.success) {
          navigate(`/order-confirm?orderId=${response.data.orderId}`)   
        } else {
          console.error("Order failed details:", response.data)
          alert(response.data.message || "Order failed")
        }
      }

      // 🔵 ONLINE PAYMENT (STRIPE)
      if (paymentMethod === "ONLINE") {
        const response = await axios.post(
          `${url}/api/order/place`,
          {
            items: orderItems,
            amount: totalAmount,
            address: { ...address, lat, lon },
            paymentMethod: "ONLINE",
            isScheduled,
            scheduledDate,
            travelDetails,
            couponCode: appliedPromo,
            discountAmount: promoDiscount,
            distance: orderDistance,
            surgeFee,
            weatherCondition
          },
          { headers: { token } }
        )

        if (response.data.success) {
          window.location.replace(response.data.session_url)
        } else {
          console.error("Order failed details:", response.data)
          alert(response.data.message || "Order failed")
        }
      }

    } catch (error) {
      console.log(error)
      alert("Something went wrong")
    }
  }

  // If Group Payment Links are ready
  if (groupRoomId && groupPaymentLinks && groupPaymentLinks[myUserId]) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', margin: '40px auto', maxWidth: '600px' }}>
        <h2 style={{ color: '#166534', marginBottom: '20px' }}>✅ Group Order Split Ready!</h2>
        <p style={{ color: '#15803d', fontSize: '16px', marginBottom: '30px' }}>
          The host has placed the order. Your individual share ({splitType}) has been calculated.
        </p>
        <button 
          onClick={() => window.location.replace(groupPaymentLinks[myUserId])}
          style={{ padding: '15px 30px', background: '#10b981', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)' }}
        >
          💳 Pay My Share
        </button>
      </div>
    )
  }

  return (
    <form className="place-order" onSubmit={placeOrder}>

      {/* LEFT: DELIVERY DETAILS */}
      <div className="place-order-left">
        <p className="title">Delivery Information</p>

        <div className="multi-fields">
          <input name="firstName" placeholder="First name" value={address.firstName} onChange={onChangeHandler} required />
          <input name="lastName" placeholder="Last name" value={address.lastName} onChange={onChangeHandler} required />
        </div>

        <input name="email" type="email" placeholder="Email address" value={address.email} onChange={onChangeHandler} required />
        <input name="phone" placeholder="Phone" value={address.phone} onChange={onChangeHandler} required />

        {/* MAP LOCATION SEARCH */}
        <div className="location-search-container" style={{ position: 'relative', marginTop: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Search Delivery Address (Street, Area, City)..." 
              value={searchQuery}
              onChange={handleAddressSearch}
              style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: 0 }}
              required
            />
            <button 
              type="button" 
              onClick={useMyLocation}
              style={{ padding: '0 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📍 Use My Location
            </button>
          </div>
          
          {isSearching && <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Searching locations...</p>}
          
          {suggestions.length > 0 && (
            <ul className="suggestions-dropdown" style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, 
              background: 'white', border: '1px solid #ccc', borderRadius: '4px', 
              maxHeight: '200px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: '5px 0 0 0',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              {suggestions.map((s, idx) => (
                <li 
                  key={idx} 
                  onClick={() => fillAddressFromOSM(s)}
                  style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '14px' }}
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="multi-fields">
          <input name="street" placeholder="Street / Area" value={address.street} onChange={onChangeHandler} required />
          <input name="city" placeholder="City" value={address.city} onChange={onChangeHandler} required />
        </div>

        <div className="multi-fields">
          <input name="state" placeholder="State" value={address.state} onChange={onChangeHandler} required />
          <input name="zip" placeholder="Zip code" value={address.zip} onChange={onChangeHandler} required />
        </div>

        {/* SCHEDULING & TRAVEL OPTIONS */}
        <div className="scheduling-section" style={{ marginTop: '20px' }}>
          <h3>Booking Options</h3>
          <label className="schedule-toggle">
            <input 
              type="checkbox" 
              checked={isScheduled} 
              onChange={(e) => setIsScheduled(e.target.checked)} 
            />
            Schedule for a Future Travel Date (Train/Flight)
          </label>
          
          {isScheduled && (
            <div className="schedule-details">
              <input 
                type="date" 
                required 
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <select 
                value={travelDetails.type} 
                onChange={(e) => setTravelDetails({...travelDetails, type: e.target.value})}
              >
                <option value="Train">Train Journey</option>
                <option value="Flight">Flight Journey</option>
              </select>
              <input 
                type="text" 
                placeholder={travelDetails.type === "Train" ? "Enter PNR Number" : "Enter Flight Number"}
                value={travelDetails.pnrOrFlightNumber}
                onChange={(e) => setTravelDetails({...travelDetails, pnrOrFlightNumber: e.target.value})}
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: CART TOTAL */}
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>

          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>₹{getTotalCartAmount()}</p>
          </div>

          <div className="cart-total-details">
            <p>Delivery Fee {surgeFee > 0 && <span style={{color: '#ef4444', fontSize: '12px', fontWeight: 'bold'}}>(Surge Applied)</span>}</p>
            <p>₹{deliveryFee}</p>
          </div>

          {surgeFee > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#b91c1c' }}>
                🌧️ <b>Rain Forecasted!</b> A small surge fee of ₹{surgeFee} has been applied due to high demand in your delivery area.
              </p>
            </div>
          )}

          {promoDiscount > 0 && (
            <div className="cart-total-details promo-applied">
              <p>Promo Discount ({appliedPromo})</p>
              <p style={{ color: 'green' }}>-₹{promoDiscount}</p>
            </div>
          )}

          <hr />

          <div className="cart-total-details total">
            <b>Total</b>
            <b>₹{totalAmount}</b>
          </div>

          {/* PAYMENT METHOD */}
          <div className="payment-method">
            <h3>Payment Method</h3>
            <label className={paymentMethod === "COD" ? "active" : ""}>
              <input
                type="radio"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              Cash on Delivery (COD)
            </label>

            <label className={paymentMethod === "ONLINE" ? "active" : ""}>
              <input
                type="radio"
                checked={paymentMethod === "ONLINE"}
                onChange={() => setPaymentMethod("ONLINE")}
              />
              Online Payment (Stripe)
            </label>
          </div>

          {groupRoomId && (
            <div className="split-bill-section" style={{ background: '#f5f3ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd6fe' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#5b21b6' }}>👥 Group Order Options</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" checked={splitType === "Even Split"} onChange={() => setSplitType("Even Split")} />
                  Even Split (Divide Total)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" checked={splitType === "Itemized Split"} onChange={() => setSplitType("Itemized Split")} />
                  Itemized Split (Pay What You Order)
                </label>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
                When you place the order, everyone in the group will get a personal payment link.
              </p>
            </div>
          )}

          <button type="submit" disabled={getTotalCartAmount() === 0}>
            {groupRoomId ? "PROCEED TO SPLIT BILL" : "PLACE ORDER"}
          </button>
        </div>
      </div>

    </form>
  )
}

export default PlaceOrder
