import React, { useState, useEffect, useContext } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/Storecontext'
import axios from 'axios'

const LoginPopup = ({ setShowLogin }) => {

  const { url, setToken } = useContext(StoreContext)

  const [currState, setCurrState] = useState("Sign Up")

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  })

  // INPUT CHANGE
  const onChangeHandler = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  // FORM SUBMIT
  const onSubmitHandler = async (e) => {
    e.preventDefault()

    const endpoint =
      currState === "Sign Up"
        ? "/api/user/register"
        : "/api/user/login"

    try {
      const response = await axios.post(
        `${url}${endpoint}`,
        data,
        { headers: { "Content-Type": "application/json" } }
      )

      console.log("Full Backend Response:", response)
      console.log("Response Data:", response.data)

      // ✅ CHECK FOR TOKEN IN DIFFERENT POSSIBLE LOCATIONS
      const receivedToken = 
        response.data.token || 
        response.data.data?.token || 
        response.data.accessToken ||
        response.data.auth_token

      if (receivedToken) {
        // Store token in localStorage first
        localStorage.setItem("token", receivedToken)
        
        // Update context
        setToken(receivedToken)
        
        // Close popup
        setShowLogin(false)
        
        // Reload page to ensure navbar and all components update
        window.location.reload()
      } else {
        // Show what was actually received
        console.error("No token found in response:", response.data)
        alert(`Login response received but no token found. Response: ${JSON.stringify(response.data)}`)
      }

    } catch (error) {
      console.error("Login Error:", error)
      console.error("Error Response:", error.response)
      
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.message ||
        "Something went wrong"
      
      alert(errorMessage)
    }
  }

  // ESC CLOSE
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowLogin(false)
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [setShowLogin])

  return (
    <div className="login-popup">
      <form className="login-popup-container" onSubmit={onSubmitHandler}>

        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img
            src={assets.cross_icon}
            alt="close"
            onClick={() => setShowLogin(false)}
          />
        </div>

        <div className="login-popup-inputs">

          {currState === "Sign Up" && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={data.name}
                onChange={onChangeHandler}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Your phone number"
                value={data.phone}
                onChange={onChangeHandler}
                required
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Your email"
            value={data.email}
            onChange={onChangeHandler}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={data.password}
            onChange={onChangeHandler}
            required
          />
        </div>

        <button type="submit">
          {currState === "Sign Up" ? "Create account" : "Login"}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>
            By continuing, I agree to the terms of use & privacy policy.
          </p>
        </div>

        <div className="login-popup-toggle">
          {currState === "Login" ? (
            <p>
              Create a new account?
              <span onClick={() => setCurrState("Sign Up")}> Click here</span>
            </p>
          ) : (
            <p>
              Already have an account?
              <span onClick={() => setCurrState("Login")}> Login here</span>
            </p>
          )}
        </div>

      </form>
    </div>
  )
}

export default LoginPopup