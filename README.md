# 🍕 Chisto — Premium Smart Food Delivery Ecosystem (MERN Stack)

<p align="center">
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">
</p>

<div align="center">
  
  [![Made with MERN](https://img.shields.io/badge/Made%20with-MERN-FF6B35?style=for-the-badge&logo=mongodb)](https://github.com)
  [![Stripe Integration](https://img.shields.io/badge/Payment-Stripe-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com)
  [![JWT Auth](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io)
  [![License](https://img.shields.io/badge/License-MIT-FFA500.svg?style=for-the-badge)](LICENSE)
  
  **A scalable, full-stack food delivery web application with custom branding, real-time tracking, an AI chatbot, and a rider ecosystem**

  ### 🔗 [Live Customer App](https://food-ordering-eight-iota.vercel.app/) &nbsp;|&nbsp; [Live Admin Panel](https://food-ordering-xo97.vercel.app/)
  
</div>

<p align="center">
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">
</p>

---

## 🌐 Live Demo

| Portal | Link |
|---|---|
| 🛍️ Customer App (Dashboard) | [food-ordering-eight-iota.vercel.app](https://food-ordering-eight-iota.vercel.app/) |
| 🛠️ Admin / Partner Panel | [food-ordering-xo97.vercel.app](https://food-ordering-xo97.vercel.app/) |

---

## 📌 Overview

**Chisto** is a premium, production-ready MERN stack food delivery platform. Designed with custom branding, an interactive AI food chatbot, real-time status updates via Socket.IO, active Leaflet mapping, a dedicated Rider Partner module, and Progressive Web App (PWA) capabilities, Chisto showcases a production-ready system architecture.

---

## 🎨 Premium Branding & Theme
* **Color System**: Adopts a curated, high-end **Deep Navy Blue** theme (`#0c2340`) across both customer and administrator web portals, removing standard templates in favor of custom-generated assets and modern typography (Outfit & Inter).
* **Infinite Brand Slider**: Home screen features a hardware-accelerated CSS infinite marquee slider displaying restaurant partner brands with smooth transitions and hover-pause interactions.

---

## ✨ Key Features

### 👥 **Customer PWA Features**
- 🔐 User registration and secure JWT login.
- 🍔 Browse food items with category filters and **Smart Search Real-time Filters**.
- 🛒 Dynamic cart management (add/remove items) with **Promo Code Carry-Over**.
- 💳 Secure checkout with Stripe integration and Cash on Delivery support.
- 📦 **Order Re-run**: One-click repeat order from receipt history.
- 🗺️ **Live Leaflet Map Tracking**: Instantly tracks active orders in real-time inside modal maps.
- 💬 **AI recommendation Chatbot**: Ask Gemini for food recommendations (e.g., "spicy veg food under ₹300") and add items directly to your cart with one click!
- 💰 **Loyalty Point System**: Automatically earn 10 points per ₹100 spent on completed orders.
- ⭐ **Verified Purchaser Reviews**: Review and rate food items only if you have ordered and received them.

### 🏍️ **Delivery Rider Features**
- 🔑 Secure Rider login and authentication (Seeded credentials: `rider@chisto.com` / `password123`).
- 📦 **Open Orders Pool**: Accept or reject unassigned local deliveries.
- 🏍️ **Milestone Updates**: Set orders to "Picked Up" or "Delivered" to instantly update the customer's tracking map in real-time.
- 💸 **Earnings Dashboard**: Track completed deliveries and payouts (₹50 commission credited per delivery).

### 📊 **Admin & Partner Dashboard**
- 🔑 Secure super-admin and brand partner logins.
- ➕ Menu management (Add/List/Remove dishes with image uploads).
- 📈 **Advanced Analytics Dashboard**: Track Total Revenue, Average Order Value (AOV), Cancellation Rates, and Repeat Customer percentages.
- 📊 **Visual Sales Charts**: Category-wise sales share meters and Top-Selling food item progress indicators.

---

## 🧠 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│                (Progressive Web Apps)                   │
├─────────────────────┬───────────────────────────────────┤
│   React Frontend    │      React Partner Panel          │
│   (Customer Side)   │      (Admin, Restaurant, Rider)   │
└──────────┬──────────┴───────────────┬───────────────────┘
           │                          │
           │      REST & Sockets      │
           │                          │
           └──────────┬───────────────┘
                       ↓
           ┌──────────────────────┐
           │   Node.js Backend    │
           │   Express.js Server  │
           └──────────┬───────────┘
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
  ┌──────────────────┐  ┌──────────────────┐
  │ MongoDB Database │  │   Socket.IO      │
  │ (Data Storage)   │  │ (Real-Time Comm) │
  └──────────────────┘  └──────────────────┘
```

---

## 📂 Project Structure
```bash
FoodTracking/
├── Backend/          # Node REST APIs, Sockets & DB Controllers
├── Frontend/         # PWA Client Application for Customers
├── admin/            # Partner (Admin, Restaurant, Rider) Dashboard
├── .gitignore        # Universal root Git ignore exclusions
└── README.md
```

---

## ⚙️ Installation & Setup

### 📋 Prerequisites
Before you begin, ensure you have Node.js, MongoDB, and a Stripe Account (for payments).

### 🚀 Quick Start

#### 1️⃣ **Backend Setup**
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory:
```env
PORT=4000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_jwt_key_here
STRIPE_SECRET_KEY=sk_test_...
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
```

Run database seeds to set up restaurants, admins, default coupons, and riders:
```bash
node populate_restaurants.js
```

Start the backend:
```bash
npm run dev
```

#### 2️⃣ **Frontend Setup**
```bash
cd ../Frontend
npm install
```

Create `.env` in the `Frontend` directory:
```env
VITE_API_URL=http://localhost:4000/api
```

Start the client application:
```bash
npm run dev
```

#### 3️⃣ **Admin Panel Setup**
```bash
cd ../admin
npm install
```

Start the panel:
```bash
npm run dev
```

---

## 🔑 Default Login Credentials
* **Super Admin**: `admin@chisto.com` / `password123`
* **Rider Partner**: `rider@chisto.com` / `password123`
* **Restaurant Partner**: `punjabidhaba@chisto.com` / `password123`
