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

  useEffect(() => {
    // Filter foods for this specific restaurant
    const filtered = food_list.filter(f => f.restaurantId === id)
    setRestaurantFoods(filtered)
    if (filtered.length > 0) {
      setRestaurantName(filtered[0].restaurantName)
    } else {
      setRestaurantName("Restaurant Menu")
    }
  }, [id, food_list])

  return (
    <div className="restaurant-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      
      <div className="restaurant-header">
        <h1>{restaurantName}</h1>
        <p>Explore our delicious menu items</p>
      </div>

      <div className="food-display-list">
        {restaurantFoods.map((item) => (
          <FoodItem
            key={item._id}
            _id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
            rating={item.averageRating || item.rating || 4.5}
            restaurantName={item.restaurantName || "Chisto Kitchen"}
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
