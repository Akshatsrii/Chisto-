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
    <div className='login'>
      <div className="login-container">
        <h2>Rider Portal</h2>
        <form onSubmit={onSubmitHandler}>
          <div className="input-group">
            <p>Email Address</p>
            <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='your@email.com' required />
          </div>
          <div className="input-group">
            <p>Password</p>
            <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Enter your password' required />
          </div>
          <button type='submit'>Login to Dashboard</button>
        </form>
      </div>
    </div>
  )
}

export default Login
