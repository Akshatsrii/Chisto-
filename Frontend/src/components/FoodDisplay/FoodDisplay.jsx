import { useState, useContext } from "react"
import { StoreContext } from "../../Context/Storecontext"
import FoodItem from "../FoodItem/FoodItem"
import ReviewModal from "../ReviewModal/ReviewModal"
import "./FoodDisplay.css"

const FoodDisplay = ({ category }) => {
  const { food_list, selectedRestaurant, searchQuery } = useContext(StoreContext)
  const [selectedFood, setSelectedFood] = useState(null)

  return (
    <div className="food-display" id="food-display">
      <h2>Top dishes near you</h2>

      <div className="food-display-list">
        {food_list.map((item) => {
          const matchesCategory = category === "All" || category === item.category
          const matchesRestaurant = selectedRestaurant === "All" || item.restaurantName === selectedRestaurant
          const matchesSearch = !searchQuery || 
                                item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                item.description.toLowerCase().includes(searchQuery.toLowerCase())
          
          if (matchesCategory && matchesRestaurant && matchesSearch) {
            return (
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
            )
          }
          return null
        })}
      </div>

      {selectedFood && (
        <ReviewModal
          foodItem={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </div>
  )
}

export default FoodDisplay
