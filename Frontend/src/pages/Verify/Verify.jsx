import React, { useContext, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { StoreContext } from "../../Context/Storecontext"

const Verify = () => {

  const { token, url } = useContext(StoreContext)
  const navigate = useNavigate()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const success = params.get("success")
  const orderId = params.get("orderId")

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await axios.post(
          `${url}/api/order/verify`,
          { success, orderId },
          { headers: { token } }
        )

        if (response.data.success) {
          navigate(`/order-confirm?orderId=${orderId}`)
        } else {
          navigate("/")   // ❌ Cancel → Dashboard
        }
      } catch (error) {
        navigate("/")
      }
    }

    if (token && orderId) {
      verifyPayment()
    }
  }, [token])

  return <p style={{ textAlign: "center", marginTop: "50px" }}>Verifying payment...</p>
}

export default Verify
