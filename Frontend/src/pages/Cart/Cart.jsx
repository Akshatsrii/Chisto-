import React, { useContext, useState } from "react"
import "./Cart.css"
import { StoreContext } from "../../Context/Storecontext"
import { useNavigate } from "react-router-dom"

const Cart = () => {

  const {
    cartItems,
    food_list,
    removeFromCart,
    getTotalCartAmount,
    url,
    promoDiscount,
    setPromoDiscount,
    appliedPromo,
    setAppliedPromo
  } = useContext(StoreContext)

  const navigate = useNavigate()

  const [promoInput, setPromoInput] = useState(appliedPromo)

  // ✅ APPLY PROMO CODE
  const applyPromoCode = () => {
    const total = getTotalCartAmount()

    if (promoInput === "SAVE10") {
      setPromoDiscount(Math.round(0.1 * total))
      setAppliedPromo("SAVE10")
    } else if (promoInput === "SAVE20") {
      setPromoDiscount(Math.round(0.2 * total))
      setAppliedPromo("SAVE20")
    } else {
      setPromoDiscount(0)
      setAppliedPromo("")
      alert("Invalid Promo Code")
    }
  }

  const subtotal = getTotalCartAmount()
  const finalAmount = Math.max(subtotal - promoDiscount, 0)

  return (
    <div className="cart">
      <div className="cart-items">

        {/* HEADER */}
        <div className="cart-items-title">
          <p>Image</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>

        <hr />

        {/* CART ITEMS */}
        {food_list.map((item) => {
          const quantity = cartItems[item._id] || 0

          if (quantity > 0) {
            return (
              <div key={item._id} className="cart-items-item">
                <img
                  src={`${url}/uploads/${item.image}`}
                  alt={item.name}
                  className="cart-item-image"
                />
                <p>{item.name}</p>
                <p>₹{item.price}</p>
                <p>{quantity}</p>
                <p>₹{item.price * quantity}</p>
                <p
                  className="remove"
                  onClick={() => removeFromCart(item._id)}
                >
                  X
                </p>
              </div>
            )
          }
          return null
        })}

        {subtotal === 0 && (
          <p className="cart-empty">Your cart is empty 🛒</p>
        )}

        <hr />

        {/* PROMO CODE */}
        <div className="promo-section">
          <input
            type="text"
            placeholder="Enter Promo Code"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
          />
          <button onClick={applyPromoCode}>Apply</button>
        </div>

        {/* TOTALS */}
        <div className="cart-summary">
          <p>
            Subtotal: <span>₹{subtotal}</span>
          </p>
          <p>
            Discount: <span>-₹{promoDiscount}</span>
          </p>
          <p className="final-total">
            Total Payable: <span>₹{finalAmount}</span>
          </p>
        </div>

        {/* PROCEED TO CHECKOUT */}
        <button
          className="place-order-btn"
          disabled={finalAmount === 0}
          onClick={() => navigate("/order")}
        >
          Proceed to Checkout
        </button>

      </div>
    </div>
  )
}

export default Cart
