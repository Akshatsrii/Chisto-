import React, { useContext } from 'react'
import './ExploreRestaurants.css'
import { StoreContext } from '../../Context/Storecontext'

const restaurantsData = [
  { name: "All", displayName: "All Brands", icon: "🍽️", cuisine: "Multi-Cuisine" },
  { name: "Punjabi Dhaba", displayName: "Punjabi Dhaba", icon: "🥘", cuisine: "North Indian" },
  { name: "Bakers Delight", displayName: "Bakers Delight", icon: "🍰", cuisine: "Bakery & Desserts" },
  { name: "Burger King", displayName: "Burger King", icon: "🍔", cuisine: "Fast Food" },
  { name: "Pizza Hut", displayName: "Pizza Hut", icon: "🍕", cuisine: "Italian Pizza" },
  { name: "South India Express", displayName: "South India Express", icon: "🍛", cuisine: "South Indian" },
  { name: "The Salad Bowl", displayName: "The Salad Bowl", icon: "🥗", cuisine: "Healthy Salads" },
  { name: "The Pasta House", displayName: "The Pasta House", icon: "🍝", cuisine: "Pastas" },
  { name: "Noodle Station", displayName: "Noodle Station", icon: "🍜", cuisine: "Chinese Noodles" },
  { name: "Sweet Treats", displayName: "Sweet Treats", icon: "🍦", cuisine: "Ice Creams & Sweets" },
  { name: "Chisto Kitchen", displayName: "Chisto Kitchen", icon: "🧑‍🍳", cuisine: "Signature Dishes" }
]

const ExploreRestaurants = () => {
  const { selectedRestaurant, setSelectedRestaurant } = useContext(StoreContext)

  return (
    <div className="explore-restaurants" id="explore-restaurants">
      <h1>Explore Top Brands Near You</h1>
      <p className="explore-restaurants-text">
        Order from your favorite restaurant brands, selected with high quality food and fast delivery.
      </p>

      <div className="restaurants-marquee-container">
        <div className="restaurants-list-scroll">
          {[...restaurantsData, ...restaurantsData].map((rest, index) => {
            const isActive = selectedRestaurant === rest.name
            return (
              <div
                key={index}
                className={`restaurant-item-card ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedRestaurant(rest.name)}
              >
                <div className="restaurant-icon-wrapper">
                  <span className="restaurant-emoji-icon">{rest.icon}</span>
                </div>
                <div className="restaurant-meta-details">
                  <h4>{rest.displayName}</h4>
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
