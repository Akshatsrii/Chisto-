const userModel = require("../models/userModel")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

const Stripe = require("stripe")
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// REGISTER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, restaurantName, restaurantAddress, referralCode } = req.body

    if (!name || !email || !password || !phone) {
      return res.json({ success: false, message: "All fields required" })
    }

    const exists = await userModel.findOne({ email })
    if (exists) {
      return res.json({ success: false, message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate unique referral code (first 4 of name + random 4)
    const myReferralCode = name.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000)

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || "customer",
      restaurantName: role === "restaurant" ? restaurantName : undefined,
      restaurantAddress: role === "restaurant" ? restaurantAddress : undefined,
      referralCode: myReferralCode,
      referredBy: referralCode || undefined
    })

    // If they used a valid referral code, credit both users 50 points
    if (referralCode) {
      const referrer = await userModel.findOne({ referralCode })
      if (referrer) {
        referrer.loyaltyPoints += 50
        user.loyaltyPoints += 50
        await referrer.save()
        await user.save()
      }
    }

    const token = createToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantName: user.restaurantName,
        loyaltyPoints: user.loyaltyPoints,
        referralCode: user.referralCode
      }
    })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" })
    }

    const token = createToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantName: user.restaurantName,
        loyaltyPoints: user.loyaltyPoints,
        isPrimeMember: user.isPrimeMember,
        referralCode: user.referralCode
      }
    })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// SUBSCRIBE TO PRIME
const subscribePrime = async (req, res) => {
  const frontend_url = "http://localhost:5173"
  try {
    const user = await userModel.findById(req.userId)
    if (!user) return res.json({ success: false, message: "User not found" })

    // Create Stripe session for recurring ₹99 payment
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Chisto Prime Subscription",
              description: "Free delivery on all orders & Priority Support"
            },
            unit_amount: 99 * 100,
            recurring: { interval: 'month' }
          },
          quantity: 1
        }
      ],
      mode: "subscription",
      success_url: `${frontend_url}/profile?prime=success`,
      cancel_url: `${frontend_url}/profile?prime=cancel`,
      customer_email: user.email
    })

    // Store a pending flag or verify later via webhook. For simplicity without webhooks:
    // we'll provide an endpoint for the frontend to confirm successful redirect.
    res.json({ success: true, session_url: session.url })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const verifyPrimeSubscription = async (req, res) => {
  try {
    // In a real app, this should be done via Stripe Webhooks (checkout.session.completed)
    // For this project, we'll let the frontend trigger it when they land on ?prime=success
    const user = await userModel.findById(req.userId)
    if (user) {
      user.isPrimeMember = true
      // Set expiry to 30 days from now
      user.primeExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      await user.save()
      res.json({ success: true, message: "Welcome to Chisto Prime!" })
    } else {
      res.json({ success: false, message: "User not found" })
    }
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ADMIN: GET REFERRAL ANALYTICS
const getReferralAnalytics = async (req, res) => {
  try {
    const adminUser = await userModel.findById(req.userId)
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" })
    }

    const allUsers = await userModel.find({})
    
    // Total users who joined via a referral
    const referredUsers = allUsers.filter(u => u.referredBy)
    
    // Viral Coefficient = (Total Referred Users) / (Total Existing Base Users)
    // Roughly, we can calculate base users as those who didn't join via referral.
    const baseUsers = allUsers.length - referredUsers.length || 1
    const viralCoefficient = (referredUsers.length / baseUsers).toFixed(2)

    // Top Referrers
    const referrersMap = {}
    referredUsers.forEach(u => {
      referrersMap[u.referredBy] = (referrersMap[u.referredBy] || 0) + 1
    })

    const topReferrersCodes = Object.keys(referrersMap).sort((a, b) => referrersMap[b] - referrersMap[a]).slice(0, 5)
    
    const topReferrers = []
    for (const code of topReferrersCodes) {
      const user = await userModel.findOne({ referralCode: code })
      if (user) {
        topReferrers.push({
          name: user.name,
          code: code,
          referrals: referrersMap[code]
        })
      }
    }

    res.json({
      success: true,
      viralCoefficient,
      totalReferred: referredUsers.length,
      totalUsers: allUsers.length,
      topReferrers
    })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// SAVE PUSH SUBSCRIPTION
const savePushSubscription = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const { subscription } = req.body
    
    // check if it already exists
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint)
    if (!exists) {
      user.pushSubscriptions.push(subscription)
      await user.save()
    }
    
    res.json({ success: true, message: "Subscription saved" })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// GET USER PROFILE
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("-password")
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { registerUser, loginUser, subscribePrime, verifyPrimeSubscription, getReferralAnalytics, savePushSubscription, getUserProfile }
