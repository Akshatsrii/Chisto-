import React, { useContext } from "react"
import "./FoodItem.css"
import { StoreContext } from "../../Context/Storecontext"

const FoodItem = ({ _id, name, price, description, image, rating = 4.5, restaurantName = "Chisto Kitchen", onReviewClick, inStock = true, dietaryPreference = "Unspecified", dietaryTags = [], allergens = [] }) => {

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

  const getDietaryTag = (pref) => {
    switch (pref) {
      case 'Veg': return <span className="diet-tag veg" key="veg">🟢 Veg</span>
      case 'Non-Veg': return <span className="diet-tag non-veg" key="non-veg">🔴 Non-Veg</span>
      case 'Vegan': return <span className="diet-tag vegan" key="vegan">🌱 Vegan</span>
      default: return null
    }
  }

  const renderDietaryTags = () => {
    if (!dietaryTags || dietaryTags.length === 0) return null;
    return dietaryTags.map(tag => (
      <span key={tag} className={`diet-tag tag-${tag.toLowerCase()}`} style={{ marginLeft: '5px', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', background: '#dcfce7', color: '#166534' }}>
        {tag === 'Vegan' ? '🌱' : (tag === 'Jain' ? '🧅🚫' : '🟢')} {tag}
      </span>
    ));
  }

  const renderAllergens = () => {
    if (!allergens || allergens.length === 0) return null;
    return (
      <div className="allergens-warning" style={{ fontSize: '10px', color: '#b91c1c', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        ⚠️ Contains: {allergens.join(', ')}
      </div>
    );
  }

  return (
    <div className={`food-item ${!inStock ? 'sold-out' : ''}`}>
      <div className="food-item-img-container">

        {/* ✅ FIXED IMAGE */}
        <img
          className="food-item-image"
          src={`${url}/uploads/${image}`}
          alt={name}
        />

        {!inStock && <div className="sold-out-overlay">Sold Out</div>}

        {inStock && (itemCount === 0 ? (
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
        ))}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name} {getDietaryTag(dietaryPreference)}</p>
          <div className="rating-stars" onClick={onReviewClick} title="Click to view reviews" style={{ cursor: 'pointer' }}>
            {renderStars(rating)}
            <span className="rating-number">{rating}</span>
          </div>
        </div>
        <p className="food-item-restaurant">by {restaurantName}</p>
        <div style={{ marginBottom: '5px' }}>
          {renderDietaryTags()}
          {renderAllergens()}
        </div>
        <p className="food-item-description">{description}</p>
        <p className="food-item-price">₹{price}</p>
      </div>
    </div>
  )
}

export default FoodItem
