import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/Storecontext'
import FoodItem from '../../components/FoodItem/FoodItem'
import ReviewModal from '../../components/ReviewModal/ReviewModal'
import './Restaurant.css'

const Restaurant = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { food_list, url } = useContext(StoreContext)
  
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantFoods, setRestaurantFoods] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [kitchenLoad, setKitchenLoad] = useState("Normal")
  const [dietaryFilter, setDietaryFilter] = useState("All")

  const fetchKitchenLoad = async (name) => {
    try {
      const response = await fetch(`${url}/api/restaurant/availability/${name}`)
      const data = await response.json()
      if (data.success && data.data) {
        setKitchenLoad(data.data.kitchenLoad || "Normal")
      }
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    // Filter foods for this specific restaurant
    const filtered = food_list.filter(f => f.restaurantId === id)
    setRestaurantFoods(filtered)
    if (filtered.length > 0) {
      const rName = filtered[0].restaurantName
      setRestaurantName(rName)
      fetchKitchenLoad(rName)
    } else {
      setRestaurantName("Restaurant Menu")
    }
  }, [id, food_list, url])

  useEffect(() => {
    const handleLoadChange = (e) => {
      if (e.detail.restaurantName === restaurantName) {
        setKitchenLoad(e.detail.kitchenLoad)
      }
    }
    window.addEventListener('kitchenLoadChanged', handleLoadChange)
    return () => window.removeEventListener('kitchenLoadChanged', handleLoadChange)
  }, [restaurantName])

  return (
    <div className="restaurant-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      
      <div className="restaurant-header">
        <h1>{restaurantName}</h1>
        <p>
          Explore our delicious menu items 
          <span style={{ 
            marginLeft: '15px', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            fontSize: '0.8rem',
            backgroundColor: kitchenLoad === 'Normal' ? '#e8f5e9' : kitchenLoad === 'Busy' ? '#fff3e0' : '#ffebee',
            color: kitchenLoad === 'Normal' ? '#2e7d32' : kitchenLoad === 'Busy' ? '#ef6c00' : '#c62828',
            border: `1px solid ${kitchenLoad === 'Normal' ? '#c8e6c9' : kitchenLoad === 'Busy' ? '#ffe0b2' : '#ffcdd2'}`
          }}>
            Kitchen Status: <b>{kitchenLoad}</b>
          </span>
        </p>
      </div>

      <div className="dietary-filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        {['All', 'Veg', 'Non-Veg', 'Vegan'].map(pref => (
          <button
            key={pref}
            onClick={() => setDietaryFilter(pref)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #ccc',
              backgroundColor: dietaryFilter === pref ? '#0c2340' : 'white',
              color: dietaryFilter === pref ? 'white' : '#555',
              cursor: 'pointer',
              transition: '0.2s'
            }}
          >
            {pref}
          </button>
        ))}
      </div>

      <div className="food-display-list">
        {restaurantFoods
          .filter(item => dietaryFilter === "All" || item.dietaryPreference === dietaryFilter)
          .map((item) => (
          <FoodItem
            key={item._id}
            _id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
            rating={item.averageRating || item.rating || 4.5}
            restaurantName={item.restaurantName || "Chisto Kitchen"}
            inStock={item.inStock !== false}
            dietaryPreference={item.dietaryPreference}
            onReviewClick={() => setSelectedFood(item)}
          />
        ))}
      </div>

      {restaurantFoods.length === 0 && (
        <div className="no-foods">
          <p>No dishes found for this restaurant.</p>
        </div>
      )}

      {selectedFood && (
        <ReviewModal
          foodItem={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </div>
  )
}

export default Restaurant
