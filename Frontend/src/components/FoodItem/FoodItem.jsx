import React, { useContext } from "react"
import "./FoodItem.css"
import { StoreContext } from "../../Context/Storecontext"

const FoodItem = ({ _id, name, price, description, image, rating = 4.5, restaurantName = "Chisto Kitchen", onReviewClick }) => {

  const { cartItems, addToCart, removeFromCart, url } =
    useContext(StoreContext)

  const itemCount = cartItems[_id] || 0

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star full-star">★</span>)
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half-star">★</span>)
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty-star">★</span>)
    }

    return stars
  }

  return (
    <div className="food-item">
      <div className="food-item-img-container">

        {/* ✅ FIXED IMAGE */}
        <img
          className="food-item-image"
          src={`${url}/uploads/${image}`}
          alt={name}
        />

        {itemCount === 0 ? (
          <img
            className="add"
            onClick={() => addToCart(_id)}
            src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png"
            alt="Add"
          />
        ) : (
          <div className="food-item-counter">
            <img
              onClick={() => removeFromCart(_id)}
              src="https://cdn-icons-png.flaticon.com/512/1828/1828899.png"
              alt="Remove"
            />
            <p>{itemCount}</p>
            <img
              onClick={() => addToCart(_id)}
              src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png"
              alt="Add"
            />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <div className="rating-stars" onClick={onReviewClick} title="Click to view reviews" style={{ cursor: 'pointer' }}>
            {renderStars(rating)}
            <span className="rating-number">{rating}</span>
          </div>
        </div>
        <p className="food-item-restaurant">by {restaurantName}</p>
        <p className="food-item-description">{description}</p>
        <p className="food-item-price">₹{price}</p>
      </div>
    </div>
  )
}

export default FoodItem
