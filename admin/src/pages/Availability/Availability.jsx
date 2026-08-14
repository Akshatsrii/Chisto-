import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './Availability.css'

const Availability = () => {
  const url = "https://food-ordering-6lji.onrender.com"
  const restaurantName = localStorage.getItem("admin-restaurantName")
  const [unavailableDates, setUnavailableDates] = useState([])
  const [newDate, setNewDate] = useState("")

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${url}/api/restaurant/availability/${restaurantName}`)
      if (response.data.success) {
        setUnavailableDates(response.data.data)
      }
    } catch (error) {
      console.log(error)
      toast.error("Error fetching availability")
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

  const saveAvailability = async () => {
    try {
      const response = await axios.post(`${url}/api/restaurant/availability/update`, {
        restaurantName,
        unavailableDates
      })

      if (response.data.success) {
        toast.success("Availability calendar saved!")
      } else {
        toast.error("Failed to save calendar")
      }
    } catch (error) {
      console.log(error)
      toast.error("Error saving calendar")
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
        <h2>Restaurant Availability Calendar</h2>
        <p>Mark the days when <strong>{restaurantName}</strong> will be closed. Users won't be able to schedule orders for these dates.</p>
      </div>

      <div className="availability-controls">
        <input 
          type="date" 
          value={newDate}
          min={new Date().toISOString().split("T")[0]} // Cant select past dates
          onChange={(e) => setNewDate(e.target.value)}
        />
        <button className="add-btn" onClick={handleAddDate}>Mark as Closed</button>
      </div>

      <div className="availability-list">
        <h3>Currently Closed Dates:</h3>
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

      <button className="save-btn" onClick={saveAvailability}>Save Calendar Settings</button>
    </div>
  )
}

export default Availability
