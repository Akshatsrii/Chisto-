import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { StoreContext } from '../../Context/Storecontext'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import './Profile.css'

const Profile = () => {
  const { t } = useTranslation()
  const { url, token } = useContext(StoreContext)
  const [searchParams, setSearchParams] = useSearchParams()
  const [isPrime, setIsPrime] = useState(localStorage.getItem('isPrimeMember') === 'true')
  const [referralCode, setReferralCode] = useState(localStorage.getItem('referralCode') || "")

  // Streak State (will be fetched from API later)
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 })

  useEffect(() => {
    // Check if redirecting from Stripe Prime subscription
    const primeStatus = searchParams.get('prime')
    if (primeStatus === 'success' && token) {
      verifyPrime()
    } else if (primeStatus === 'cancel') {
      toast.error("Prime subscription cancelled.")
      setSearchParams({})
    }

    if (token) {
      fetchUserData()
    }
  }, [searchParams, token])

  const fetchUserData = async () => {
    try {
      const res = await axios.get(`${url}/api/user/profile`, { headers: { token } })
      if (res.data.success) {
        setStreakData({
          currentStreak: res.data.user.currentStreak || 0,
          longestStreak: res.data.user.longestStreak || 0
        })
      }
    } catch(err) {
      console.log("Error fetching profile", err)
    }
  }

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
      <h1>{t('profile.title', 'My Profile')}</h1>

      <div className="profile-card prime-section">
        <h2>👑 Chisto Prime Membership</h2>
        {isPrime ? (
          <div>
            <p className="active-status">✅ {t('profile.primeBannerTitle', 'You are an active Prime Member!')}</p>
            <p>{t('profile.primeBannerDesc', 'Enjoy free delivery on all your orders and priority customer support.')}</p>
          </div>
        ) : (
          <div>
            <p>Join Chisto Prime for ₹99/month and get free delivery on all orders!</p>
            <button onClick={subscribeToPrime} className="subscribe-btn">Subscribe Now</button>
          </div>
        )}
      </div>

      <div className="profile-card streak-section">
        <h2>🔥 {t('profile.streakTitle', 'Your Ordering Streak')}</h2>
        <div className="streak-stats">
          <div className="streak-box">
            <h3>{streakData.currentStreak}</h3>
            <p>{t('profile.currentStreak', 'Current Streak')} ({t('profile.weeks', 'Weeks')})</p>
          </div>
          <div className="streak-box">
            <h3>{streakData.longestStreak}</h3>
            <p>{t('profile.longestStreak', 'Longest Streak')} ({t('profile.weeks', 'Weeks')})</p>
          </div>
        </div>
      </div>

      <div className="profile-card referral-section">
        <h2>🎁 {t('profile.referEarnTitle', 'Refer & Earn')}</h2>
        <p>{t('profile.referEarnDesc', 'Invite your friends to Chisto Kitchen using your referral code. When they sign up, both of you earn 50 Loyalty Points!')}</p>
        <div className="referral-box">
          <span className="code">{t('profile.yourCode', 'Your Referral Code:')} {referralCode || "No Code Available"}</span>
          <button onClick={copyReferral} disabled={!referralCode}>Copy</button>
        </div>
      </div>
    </div>
  )
}

export default Profile
