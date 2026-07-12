# 🍕 Chisto — Premium Smart Food Delivery Ecosystem (MERN Stack)

Chisto is a high-performance, full-stack food delivery ecosystem built using the MERN stack. Designed with custom branding, an interactive AI food chatbot, real-time status updates via Socket.IO, active Leaflet mapping, a dedicated Rider Partner module, and Progressive Web App (PWA) capabilities, Chisto showcases a production-ready system architecture.

---

## 🎨 Premium Branding & Theme
* **Color System**: Adopts a curated, high-end **Deep Navy Blue** theme (`#0c2340`) across both customer and administrator web portals, removing standard templates in favor of custom-generated assets and modern typography (Google Fonts Outfit & Inter).
* **Infinite Brand Slider**: Home screen features a hardware-accelerated CSS infinite marquee slider displaying restaurant partner brands with smooth transitions and hover-pause interactions.

---

## 🧩 Architecture & Ecosystem Modules

Chisto is structured into **four independent modules**:

### 👥 1. Customer Portal (Frontend)
A responsive Progressive Web App built using React.
* **Smart Search Filter**: Interactive navbar toggle filter matching menu options in real-time.
* **Loyalty Points & Coupons**: Check out using `WELCOME50` coupon codes with dynamic minimum order filters. Earns **10 Loyalty Points per ₹100 spent**.
* **Verified Purchaser Reviews**: Restricts rating submissions (1-5 stars + feedback) to verified buyers of that specific item.
* **Map Tracking Popup**: Renders leaflet map tiles dynamically with invalidation checks inside modal windows.
* **Order Re-run**: One-click order repeats parsed from receipt data.

### ⚙️ 2. Core Server & APIs (Backend)
High-performance REST API and WebSocket host built using Node.js, Express, and Socket.IO.
* **Real-Time WebSockets**: Dispatches instant status progression events to specific rooms matching order ID.
* **Commission Engine**: Automatically credits ₹50 commission payouts to assigned delivery rider profiles on successful orders.
* **JWT Authorization**: Encrypted routes for admins, restaurant managers, riders, and customers.

### 🏍️ 3. Delivery Rider Panel (Rider App)
Integrated directly within the partner portal.
* **Open Orders Pool**: Pulls nearby unassigned deliveries. Riders can accept/reject jobs.
* **Milestone Actions**: Live state transition updates (Picked Up ➔ Delivered) which instantly sync back to the customer's active tracking map via socket events.
* **Earnings Log**: Tracks total completed deliveries and payouts.

### 📊 4. Administrator Panel (Advanced Analytics)
* **Advanced KPIs**: Computes Average Order Value (AOV), customer repeat ratios, and order cancellation trends.
* **Category Sales Distribution**: Percentage layout indicators for menu category performance.
* **Top Selling Food Item Charts**: Dynamic count-based progress bars listing popular items.

---

## 💻 Tech Stack
* **Frontend**: React.js, Tailwind CSS, Axios, React Router, Leaflet Maps, Socket.IO Client.
* **Backend**: Node.js, Express.js, MongoDB (Mongoose ODM), Socket.IO, Gemini Pro AI.
* **PWA**: Service Workers (sw.js offline shell caching), manifest.json, push notification handlers.

---

## 📂 Folder Structure
```bash
FoodTracking/
├── Backend/          # Node REST APIs, Sockets & DB Controllers
├── Frontend/         # PWA Client Application for Customers
├── admin/            # Partner (Admin, Restaurant, Rider) Dashboard
├── .gitignore        # Universal root Git ignore exclusions
└── README.md
```

---

## 🔧 Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone <repo-url>
   cd FoodTracking
   ```

2. **Database Seeding**:
   Configure `.env` in `Backend` containing `MONGO_URI` and run user population:
   ```bash
   cd Backend
   npm install
   node populate_restaurants.js
   ```

3. **Run Services locally**:
   * **Backend**: `npm run dev` (Port 4000)
   * **Frontend**: `npm run dev` (Port 5173)
   * **Admin Panel**: `npm run dev` (Port 5174)