import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { StoreContext } from '../../Context/Storecontext'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import './Profile.css'

const Profile = () => {
  const { url, token } = useContext(StoreContext)
  const [searchParams, setSearchParams] = useSearchParams()
  const [isPrime, setIsPrime] = useState(localStorage.getItem('isPrimeMember') === 'true')
  const [referralCode, setReferralCode] = useState(localStorage.getItem('referralCode') || "")

  useEffect(() => {
    // Check if redirecting from Stripe Prime subscription
    const primeStatus = searchParams.get('prime')
    if (primeStatus === 'success' && token) {
      verifyPrime()
    } else if (primeStatus === 'cancel') {
      toast.error("Prime subscription cancelled.")
      setSearchParams({})
    }
  }, [searchParams, token])

  const verifyPrime = async () => {
    try {
      const res = await axios.post(`${url}/api/user/prime/verify`, {}, { headers: { token } })
      if (res.data.success) {
        toast.success(res.data.message)
        setIsPrime(true)
        localStorage.setItem('isPrimeMember', 'true')
        setSearchParams({})
      }
    } catch (e) {
      console.log(e)
    }
  }

  const subscribeToPrime = async () => {
    if (!token) return toast.error("Please login to subscribe")
    try {
      const res = await axios.post(`${url}/api/user/prime/subscribe`, {}, { headers: { token } })
      if (res.data.success) {
        window.location.replace(res.data.session_url)
      } else {
        toast.error(res.data.message)
      }
    } catch (e) {
      console.log(e)
      toast.error("Error subscribing to Prime")
    }
  }

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode)
    toast.success("Referral code copied!")
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <div className="profile-card prime-section">
        <h2>👑 Chisto Prime Membership</h2>
        {isPrime ? (
          <div>
            <p className="active-status">✅ You are an active Prime Member!</p>
            <p>Enjoy free delivery on all your orders and priority customer support.</p>
          </div>
        ) : (
          <div>
            <p>Join Chisto Prime for ₹99/month and get free delivery on all orders!</p>
            <button onClick={subscribeToPrime} className="subscribe-btn">Subscribe Now</button>
          </div>
        )}
      </div>

      <div className="profile-card referral-section">
        <h2>🎁 Refer & Earn</h2>
        <p>Invite your friends to Chisto Kitchen using your referral code. When they sign up, both of you earn 50 Loyalty Points!</p>
        <div className="referral-box">
          <span className="code">{referralCode || "No Code Available"}</span>
          <button onClick={copyReferral} disabled={!referralCode}>Copy</button>
        </div>
      </div>
    </div>
  )
}

export default Profile
