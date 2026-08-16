# 🍕 Chisto — Premium Smart Food Delivery Ecosystem (MERN Stack)

<p align="center">
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">
</p>

<div align="center">
  
  [![Made with MERN](https://img.shields.io/badge/Made%20with-MERN-FF6B35?style=for-the-badge&logo=mongodb)](https://github.com)
  [![CI/CD Pipeline](https://github.com/Akshatsrii/Food-Ordering/actions/workflows/ci.yml/badge.svg)](https://github.com/Akshatsrii/Food-Ordering/actions)
  [![Stripe Integration](https://img.shields.io/badge/Payment-Stripe-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com)
  [![JWT Auth](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io)
  [![License](https://img.shields.io/badge/License-MIT-FFA500.svg?style=for-the-badge)](LICENSE)
  
  **A scalable, full-stack food delivery web application with custom branding, real-time tracking, an AI chatbot, and a rider ecosystem**

  ### 🔗 [Live Customer App](https://food-ordering-eight-iota.vercel.app/) &nbsp;|&nbsp; [Live Admin Panel](https://food-ordering-xo97.vercel.app/)
  
</div>

---

## 📌 Overview

**Chisto** is a premium, production-ready MERN stack food delivery platform. Designed with custom branding, an interactive AI food chatbot, real-time status updates via Socket.IO, active Leaflet mapping, a dedicated Rider Partner module, and Progressive Web App (PWA) capabilities, Chisto showcases a production-ready system architecture.

---

## 🚀 Advanced Features (Recently Added)

### 👥 **Customer Experience & Ordering**
- 🎙️ **AI Voice Ordering**: Click the "Voice Order" button, speak your craving (e.g., "I want a spicy chicken pizza"), and the AI will automatically find the best match and add it to your cart.
- 🫂 **Group Ordering & Split Bill**: Create a group cart, invite friends via a shareable link, sync items in real-time via Socket.IO, and instantly split the bill (evenly or itemized) via Stripe!
- 📍 **Smart Address Autocomplete**: Type your address and instantly get predictions and exact coordinates via the OpenStreetMap Nominatim API.
- 📏 **OSRM Distance Routing**: Calculates the exact road distance from the restaurant to the delivery location to generate accurate dynamic delivery fees.
- 🌧️ **Dynamic Weather & Surge Pricing**: Automatically checks the current weather (using a simulated API) and applies a "Rain Surge Fee" if the conditions are bad.
- 📱 **Progressive Web App (PWA) & Offline Mode**: Install Chisto as a native app on your phone. Even if your internet goes down, you can browse cached pages and place orders offline (they sync automatically when you reconnect!).
- 🏪 **Single-Restaurant Enforcement**: Mimics real-world logic—users can only add items from one restaurant at a time. The platform features dedicated pages for each of our 50 partner restaurants.

### 🛡️ **Safety & Sustainability**
- 📹 **WebRTC Secure Delivery Verification**: Customers and riders can initiate a secure, peer-to-peer live video call to verify high-value deliveries in real time!
- 🍃 **Green Delivery Score**: Calculates and awards "Green Points" for eco-friendly deliveries (e.g., short distances, bicycle riders), gamifying sustainability.

### 🛠️ **Admin & Partner Management**
- 🍱 **Bento-Grid Admin Dashboard**: A beautiful, modern, Tailwind-powered Bento UI dashboard for the Admin panel with interactive charts (Recharts).
- 🎟️ **Promo Code & Coupon System**: Admins can generate custom coupons (e.g., "CHISTO50"), set expiry dates, and usage limits, which users can apply seamlessly at checkout.
- 📄 **Smart Menu Import (OCR)**: Restaurant partners can upload a photo of their physical menu, and Tesseract.js will automatically extract text to auto-fill the Add Food form.
- 👨‍🍳 **Live Kitchen Load Indicator**: Calculates real-time kitchen busyness based on pending orders, updating the frontend dynamically via Socket.IO.
- 📊 **Scale-Tested Database**: Seeded with **50 Unique Restaurants** and **750+ Dishes** to ensure robust performance and load testing.

### 🌟 **Growth & Engagement**
- 👑 **Chisto Prime Subscription**: Integrated Stripe recurring billing for a Prime membership that gives users unlimited free delivery.
- 🤝 **Referral System**: Unique referral codes for each user. Inviting friends awards both users with loyalty points, tracked via a Viral Coefficient analytics dashboard.
- 🔔 **Web Push Notifications**: Leverages the Web Push API and VAPID keys to send real-time order updates to the user's device, even when the app is closed.

### 🔒 **Security, Testing & DevOps**
- 🛡️ **API Hardening**: Express endpoints are secured with `helmet`, `express-mongo-sanitize`, and `express-rate-limit` to prevent brute force and NoSQL injection.
- 📚 **Swagger API Docs**: Comprehensive OpenAPI specification available at `/api-docs` for easy API testing and visualization.
- 🧪 **Automated Testing**: Robust test coverage using Jest + Supertest (Backend) and Vitest + React Testing Library (Frontend).
- ⚙️ **CI/CD Pipeline**: Automated GitHub Actions workflow runs linting and test suites on every push to the main branch.

---

## 🎨 Premium Branding & Theme
* **Color System**: Adopts a curated, high-end **Deep Navy Blue** theme (`#0c2340`) across both customer and administrator web portals, removing standard templates in favor of custom-generated assets and modern typography (Outfit & Inter).
* **Infinite Brand Slider**: Home screen features a hardware-accelerated CSS infinite marquee slider displaying restaurant partner brands with smooth transitions and hover-pause interactions.

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

Run database seeds to set up 50 restaurants and 750+ food items:
```bash
node seed.js
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
