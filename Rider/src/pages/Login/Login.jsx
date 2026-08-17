import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './Login.css'

const Login = ({ setToken }) => {
  const url = import.meta.env.VITE_BACKEND_URL || "https://food-ordering-6lji.onrender.com"
  const [data, setData] = useState({
    email: "",
    password: ""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value
    setData(data => ({ ...data, [name]: value }))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      const response = await axios.post(`${url}/api/user/login`, data)
      if (response.data.success) {
        if (response.data.user.role === 'admin' || response.data.user.role === 'rider') {
           setToken(response.data.token)
           localStorage.setItem("rider-token", response.data.token)
           toast.success("Login Successful")
        } else {
           toast.error("Not authorized. Riders only.")
        }
      } else {
        toast.error(response.data.message)
      }
    } catch (err) {
      toast.error("Login failed")
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={onSubmitHandler} className="auth-container">
        <div style={{textAlign: 'center', marginBottom: '-10px'}}>
           <img src="/logo.png" alt="Chisto" style={{height: '60px', width: 'auto'}} onError={(e) => e.target.style.display='none'}/>
        </div>
        <div className="auth-title">
          <h2>Rider Portal</h2>
          <p>Chisto Delivery Partner</p>
        </div>

        <div className="auth-inputs">
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
          Login to Dashboard
        </button>

      </form>
    </div>
  )
}

export default Login
