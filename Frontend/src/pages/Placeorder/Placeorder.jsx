import React, { useContext, useState } from "react"
import axios from "axios"
import "./Placeorder.css"
import { StoreContext } from "../../Context/Storecontext"
import { useNavigate } from "react-router-dom"

const PlaceOrder = () => {

  const navigate = useNavigate()

  const {
    cartItems,
    food_list,
    getTotalCartAmount,
    token,
    url,
    promoDiscount,
    appliedPromo
  } = useContext(StoreContext)

  // DELIVERY FORM STATE
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: ""
  })

  // PAYMENT METHOD STATE
  const [paymentMethod, setPaymentMethod] = useState("COD")

  // HANDLE FORM INPUT
  const onChangeHandler = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value })
  }

  // BUILD ORDER ITEMS
  const orderItems = food_list
    .filter(item => cartItems[item._id] > 0)
    .map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      quantity: cartItems[item._id],
      restaurantId: item.restaurantId,
      restaurantName: item.restaurantName || "Chisto Kitchen",
      image: item.image
    }))

  const deliveryFee = getTotalCartAmount() === 0 ? 0 : 40
  const totalAmount = Math.max(getTotalCartAmount() + deliveryFee - promoDiscount, 0)

  // PLACE ORDER
  const placeOrder = async (e) => {
    e.preventDefault()

    if (!token) {
      alert("Please login first")
      return
    }

    if (orderItems.length === 0) {
      alert("Cart is empty")
      return
    }

    try {
      // 🟢 CASH ON DELIVERY
      if (paymentMethod === "COD") {
        const response = await axios.post(
          `${url}/api/order/place`,
          {
            items: orderItems,
            amount: totalAmount,
            address,
            paymentMethod: "COD"
          },
          { headers: { token } }
        )

        if (response.data.success) {
          navigate(`/order-confirm?orderId=${response.data.orderId}`)   // ✅ redirect
        } else {
          alert("Order failed")
        }
      }

      // 🔵 ONLINE PAYMENT (STRIPE)
      if (paymentMethod === "ONLINE") {
        const response = await axios.post(
          `${url}/api/order/place`,
          {
            items: orderItems,
            amount: totalAmount,
            address,
            paymentMethod: "ONLINE"
          },
          { headers: { token } }
        )

        if (response.data.success) {
          window.location.replace(response.data.session_url)
        } else {
          alert("Order failed")
        }
      }

    } catch (error) {
      console.log(error)
      alert("Something went wrong")
    }
  }

  return (
    <form className="place-order" onSubmit={placeOrder}>

      {/* LEFT: DELIVERY DETAILS */}
      <div className="place-order-left">
        <p className="title">Delivery Information</p>

        <div className="multi-fields">
          <input name="firstName" placeholder="First name" onChange={onChangeHandler} required />
          <input name="lastName" placeholder="Last name" onChange={onChangeHandler} required />
        </div>

        <input name="email" type="email" placeholder="Email address" onChange={onChangeHandler} required />
        <input name="street" placeholder="Street" onChange={onChangeHandler} required />

        <div className="multi-fields">
          <input name="city" placeholder="City" onChange={onChangeHandler} required />
          <input name="state" placeholder="State" onChange={onChangeHandler} required />
        </div>

        <div className="multi-fields">
          <input name="zip" placeholder="Zip code" onChange={onChangeHandler} required />
          <input name="country" placeholder="Country" onChange={onChangeHandler} required />
        </div>

        <input name="phone" placeholder="Phone" onChange={onChangeHandler} required />
      </div>

      {/* RIGHT: CART TOTAL */}
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>

          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>₹{getTotalCartAmount()}</p>
          </div>

          <div className="cart-total-details">
            <p>Delivery Fee</p>
            <p>₹{deliveryFee}</p>
          </div>

          {promoDiscount > 0 && (
            <div className="cart-total-details promo-applied">
              <p>Promo Discount ({appliedPromo})</p>
              <p>-₹{promoDiscount}</p>
            </div>
          )}

          <hr />

          <div className="cart-total-details total">
            <b>Total</b>
            <b>₹{totalAmount}</b>
          </div>

          {/* PAYMENT METHOD */}
          <div className="payment-method">
            <h3>Payment Method</h3>
            <label className={paymentMethod === "COD" ? "active" : ""}>
              <input
                type="radio"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              Cash on Delivery (COD)
            </label>

            <label className={paymentMethod === "ONLINE" ? "active" : ""}>
              <input
                type="radio"
                checked={paymentMethod === "ONLINE"}
                onChange={() => setPaymentMethod("ONLINE")}
              />
              Online Payment (Stripe)
            </label>
          </div>

          <button type="submit" disabled={getTotalCartAmount() === 0}>
            PLACE ORDER
          </button>
        </div>
      </div>

    </form>
  )
}

export default PlaceOrder
