import React, { useState, useContext } from 'react'
import './ReviewModal.css'
import { StoreContext } from '../../Context/Storecontext'

const ReviewModal = ({ foodItem, onClose }) => {
  const { addFoodReview, token } = useContext(StoreContext)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!foodItem) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setErrorMsg('Please login to submit a review!')
      return
    }
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      const response = await addFoodReview(foodItem._id, rating, comment)
      if (response.success) {
        setComment('')
        setRating(5)
        onClose()
      } else {
        setErrorMsg(response.message || 'Failed to submit review.')
      }
    } catch (error) {
      setErrorMsg('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>Customer Reviews</h2>
          <button className="review-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="review-modal-body">
          {/* Food Details */}
          <div className="review-food-info">
            <h3>{foodItem.name}</h3>
            <p className="restaurant-badge">Sold by: {foodItem.restaurantName || 'Chisto Kitchen'}</p>
            <div className="rating-summary">
              <span className="rating-val">{foodItem.averageRating || '4.5'}</span>
              <span className="star-icon">⭐</span>
              <span className="count-label">({foodItem.reviews?.length || 0} reviews)</span>
            </div>
          </div>

          <hr />

          {/* List of Existing Reviews */}
          <div className="existing-reviews-list">
            <h4>Reviews ({foodItem.reviews?.length || 0})</h4>
            {foodItem.reviews && foodItem.reviews.length > 0 ? (
              foodItem.reviews.map((rev, index) => (
                <div key={index} className="review-item-card">
                  <div className="review-item-header">
                    <div className="user-avatar">
                      {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-meta">
                      <h5>{rev.userName || 'Anonymous User'}</h5>
                      <span className="review-date">
                        {rev.date ? new Date(rev.date).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <div className="user-rating-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`star ${i < rev.rating ? 'active' : ''}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {rev.comment && <p className="review-comment-text">{rev.comment}</p>}
                </div>
              ))
            ) : (
              <p className="no-reviews-fallback">No reviews yet. Be the first to review!</p>
            )}
          </div>

          <hr />

          {/* Review Input Form */}
          <form className="add-review-form" onSubmit={handleSubmit}>
            <h4>Leave a Review</h4>
            {errorMsg && <p className="review-error-alert">{errorMsg}</p>}

            {/* Star Rating Select */}
            <div className="star-rating-selector">
              <p>Your Rating:</p>
              <div className="stars-row">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starVal = i + 1
                  return (
                    <span
                      key={i}
                      className={`selector-star ${starVal <= (hoverRating || rating) ? 'filled' : ''}`}
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Written Comment */}
            <div className="comment-input-group">
              <textarea
                placeholder="Share your experience with this food..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
                required
              ></textarea>
            </div>

            <button type="submit" className="submit-review-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
