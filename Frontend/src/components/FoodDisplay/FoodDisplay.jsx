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
      <h2>Top Special Dishes Near You</h2>

      <div className="food-display-list">
        {food_list
          .filter(item => {
            const matchesCategory = category === "All" || category === item.category
            const matchesSearch = !searchQuery || 
                                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.description.toLowerCase().includes(searchQuery.toLowerCase())
            const isSpecial = (item.averageRating || item.rating || 4.5) >= 4.5
            return matchesCategory && matchesSearch && isSpecial
          })
          .slice(0, 12)
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
              onReviewClick={() => setSelectedFood(item)}
            />
        ))}
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
