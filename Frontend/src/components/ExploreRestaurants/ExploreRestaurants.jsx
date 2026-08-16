import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import './ExploreRestaurants.css'
import { StoreContext } from '../../Context/Storecontext'

const ExploreRestaurants = () => {
  const { food_list } = useContext(StoreContext)
  const navigate = useNavigate()

  // Derive unique restaurants from food_list
  const uniqueRestaurants = Array.from(new Set(food_list.map(f => f.restaurantId)))
    .map(id => {
      const food = food_list.find(f => f.restaurantId === id)
      return {
        _id: id,
        name: food ? food.restaurantName : "Unknown",
        icon: "🍽️",
        cuisine: "Multi-Cuisine"
      }
    })
    // Only show up to 20 restaurants on home page marquee to avoid lag
    .slice(0, 20)

  return (
    <div className="explore-restaurants" id="explore-restaurants">
      <h1>Explore Top Brands Near You</h1>
      <p className="explore-restaurants-text">
        Order from your favorite restaurant brands, selected with high quality food and fast delivery.
      </p>

      <div className="restaurants-marquee-container">
        <div className="restaurants-list-scroll">
          {[...uniqueRestaurants, ...uniqueRestaurants].map((rest, index) => {
            if (!rest._id) return null
            return (
              <div
                key={`${rest._id}-${index}`}
                className="restaurant-item-card"
                onClick={() => navigate(`/restaurant/${rest._id}`)}
              >
                <div className="restaurant-icon-wrapper">
                  <span className="restaurant-emoji-icon">{rest.icon}</span>
                </div>
                <div className="restaurant-meta-details">
                  <h4>{rest.name}</h4>
                  <p>{rest.cuisine}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <hr />
    </div>
  )
}

export default ExploreRestaurants
