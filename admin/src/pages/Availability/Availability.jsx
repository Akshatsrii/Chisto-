import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './Availability.css'

const Availability = () => {
  const url = "http://localhost:4000"
  const restaurantName = localStorage.getItem("admin-restaurantName")
  
  const [unavailableDates, setUnavailableDates] = useState([])
  const [newDate, setNewDate] = useState("")
  
  // Location Settings
  const [latitude, setLatitude] = useState(28.6139)
  const [longitude, setLongitude] = useState(77.2090)
  const [maxDeliveryRadius, setMaxDeliveryRadius] = useState(5)

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${url}/api/restaurant/availability/${restaurantName}`)
      if (response.data.success) {
        setUnavailableDates(response.data.data.unavailableDates || [])
        if (response.data.data.latitude) setLatitude(response.data.data.latitude)
        if (response.data.data.longitude) setLongitude(response.data.data.longitude)
        if (response.data.data.maxDeliveryRadius) setMaxDeliveryRadius(response.data.data.maxDeliveryRadius)
      }
    } catch (error) {
      console.log(error)
      toast.error("Error fetching settings")
    }
  }

  useEffect(() => {
    if (restaurantName) {
      fetchAvailability()
    }
  }, [restaurantName])

  const handleAddDate = () => {
    if (!newDate) {
      toast.error("Please select a date")
      return
    }
    if (unavailableDates.includes(newDate)) {
      toast.error("Date is already marked as unavailable")
      return
    }

    setUnavailableDates([...unavailableDates, newDate])
    setNewDate("")
  }

  const handleRemoveDate = (dateToRemove) => {
    setUnavailableDates(unavailableDates.filter(date => date !== dateToRemove))
  }

  const saveSettings = async () => {
    try {
      const response = await axios.post(`${url}/api/restaurant/availability/update`, {
        restaurantName,
        unavailableDates,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        maxDeliveryRadius: parseFloat(maxDeliveryRadius)
      })

      if (response.data.success) {
        toast.success("Settings saved successfully!")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      console.log(error)
      toast.error("Error saving settings")
    }
  }

  // To display nice dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="availability-page">
      <div className="availability-header">
        <h2>Restaurant Settings & Availability</h2>
        <p>Configure delivery zones and mark the days when <strong>{restaurantName}</strong> will be closed.</p>
      </div>

      <div className="settings-container" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Availability Calendar */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3>Calendar (Closed Dates)</h3>
          <div className="availability-controls" style={{ marginTop: '10px' }}>
            <input 
              type="date" 
              value={newDate}
              min={new Date().toISOString().split("T")[0]} 
              onChange={(e) => setNewDate(e.target.value)}
            />
            <button className="add-btn" onClick={handleAddDate}>Mark as Closed</button>
          </div>

          <div className="availability-list">
            {unavailableDates.length === 0 ? (
              <p className="no-dates">Your restaurant is fully available everyday! 🎉</p>
            ) : (
              <ul>
                {unavailableDates.sort().map((date, index) => (
                  <li key={index}>
                    <span className="date-text">🚫 {formatDate(date)}</span>
                    <button className="remove-btn" onClick={() => handleRemoveDate(date)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Location Settings */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>📍 Delivery Settings (Map)</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>Restaurant Latitude</label>
            <input 
              type="number" 
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>Restaurant Longitude</label>
            <input 
              type="number" 
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>Max Delivery Radius (in km)</label>
            <input 
              type="number" 
              step="any"
              value={maxDeliveryRadius}
              onChange={(e) => setMaxDeliveryRadius(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Orders outside this radius will be blocked.</p>
          </div>
        </div>

      </div>

      <button className="save-btn" onClick={saveSettings} style={{ marginTop: '30px' }}>Save All Settings</button>
    </div>
  )
}

export default Availability

