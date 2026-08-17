import React, { useState } from 'react'
import axios from 'axios'
import './Auth.css'
import { toast } from 'react-toastify'

const Auth = ({ onLoginSuccess }) => {
  const [currState, setCurrState] = useState("Login")
  const url = import.meta.env.VITE_BACKEND_URL || "https://food-ordering-6lji.onrender.com"

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    restaurantName: "",
    restaurantAddress: ""
  })

  const onChangeHandler = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let endpoint = currState === "Login" ? "/api/user/login" : "/api/user/register"
    
    // Restaurant registration payload additions
    const payload = {
      name: currState === "Register" ? data.name : undefined,
      email: data.email,
      password: data.password,
      role: currState === "Register" ? "restaurant" : undefined,
      restaurantName: currState === "Register" ? data.restaurantName : undefined,
      restaurantAddress: currState === "Register" ? data.restaurantAddress : undefined
    }

    try {
      const response = await axios.post(url + endpoint, payload)

      if (response.data.success) {
        const { token, user } = response.data
        
        if (user.role !== "restaurant" && user.role !== "admin") {
          toast.error("Access Denied: Only Restaurant Partners can log in here.")
          return
        }

        localStorage.setItem("admin-token", token)
        localStorage.setItem("admin-role", user.role)
        localStorage.setItem("admin-restaurantName", user.restaurantName || "Chisto Kitchen")
        
        toast.success(`Welcome ${user.name}! Login successful.`)
        onLoginSuccess(token, user.role, user.restaurantName)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error("Authentication Server Error")
      console.log(error)
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-container">
        <div className="auth-title">
          <h2>{currState}</h2>
          <p>Chisto Restaurant Partner Portal</p>
        </div>

        <div className="auth-inputs">
          {currState === "Register" && (
            <>
              <div className="input-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  onChange={onChangeHandler}
                  value={data.name}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="restaurantName"
                  placeholder="Restaurant / Hotel Name"
                  onChange={onChangeHandler}
                  value={data.restaurantName}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="restaurantAddress"
                  placeholder="Restaurant Address"
                  onChange={onChangeHandler}
                  value={data.restaurantAddress}
                  required
                />
              </div>
            </>
          )}

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              onChange={onChangeHandler}
              value={data.email}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={onChangeHandler}
              value={data.password}
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-submit-btn">
          {currState === "Register" ? "Create Account" : "Login"}
        </button>

        <div className="auth-condition">
          {currState === "Login" ? (
            <p>
              Become a Partner?{" "}
              <span onClick={() => setCurrState("Register")}>Register here</span>
            </p>
          ) : (
            <p>
              Already have a Partner account?{" "}
              <span onClick={() => setCurrState("Login")}>Login here</span>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

export default Auth

