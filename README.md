# BL Battle (FF-Arena) 🎮

BL Battle is a high-performance, premium Free Fire Tournament Arena web platform designed for gaming communities and tournament organizers. It allows users to register for matches (Solo, Duo, Squad, and BR Ranked), track live standings on a leaderboard, deposit and withdraw coins securely via UPI/Razorpay, and automatically receive room credentials prior to match starts.

---

## 🚀 Key Features

* **User Authentication & Verification:** 
  * Seamless login & registration with secure cryptographic password hashing (`bcryptjs`).
  * Dynamic email OTP verification for new registrations to prevent spam.
  * Google OAuth Integration (`@react-oauth/google`) for single-click sign-in.
* **Tournament Management:**
  * Interactive tournament cards showing entry fees, map types, schedule, and team formats.
  * Real-time participant counters and slots validation.
  * Advanced **BR Ranked Per-Kill Reward** model—players get rewarded automatically for each kill they secure, straight to their wallets.
* **Room Credentials System:**
  * Hosts can update custom room credentials (Room ID & Password) in the admin console.
  * Upon credential updates, real-time emails are instantly dispatched to all registered players and observers.
  * Credentials appear on the user's dashboard 10-15 minutes before the match start.
* **Secure Financial Wallet:**
  * **Deposits:** Seamless deposits using the **Razorpay Payment Gateway** (1 Coin = 1 INR).
  * **Withdrawals:** Request withdrawals directly to UPI IDs (minimum withdrawal: 50 coins).
* **BL Battle Assistant (Chatbot):**
  * Rule-based tactical chatbot that works entirely on the client-side (no API key required).
  * Synthesized audio blips generated dynamically using the browser's **HTML5 Web Audio API** (includes sound mute/unmute toggle).
  * Integrated navigation links that redirect users to different pages in the app (e.g., Wallet, Ranks) directly from chat bubbles.

---

## 🛠️ Technology Stack

### Frontend (Client Web App)
* **Framework:** React 19 (Vite 8 build toolchain)
* **Styling:** Tailwind CSS v4 (supporting custom neon glassmorphism themes)
* **Routing:** React Router DOM v7
* **Animations:** GSAP (GreenSock Animation Platform) for neon landing page animations
* **Icons:** Lucide React
* **Hosting:** Vercel

### Backend (Server API)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (using Mongoose ODM)
* **Mail Dispatch:** Nodemailer (Gmail SMTP credentials integration)
* **Security:** JWT (JSON Web Tokens) & BcryptJS
* **Payments:** Razorpay Node.js SDK
* **Hosting:** Render

---

## 📁 Repository Structure

```text
├── backend/
│   ├── middleware/       # JWT and Route protection middlewares
│   ├── models/           # MongoDB Mongoose Schemas (User, Tournament, Transaction)
│   ├── routes/           # Express endpoint router groups
│   ├── services/         # Mailer and notification logic
│   ├── utils/            # Helper scripts and config bindings
│   ├── server.js         # API Gateway Entrypoint
│   └── package.json
├── frontend/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── assets/       # Visual media assets
│   │   ├── components/   # Modular components (Navbar, Chatbot, Cards)
│   │   ├── context/      # React Authentication Context state
│   │   ├── pages/        # Route pages (Home, Profile, Wallet, Ranks)
│   │   ├── utils/        # Axios API wrapper configurations
│   │   ├── App.jsx       # Layout structure & routing table
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## ⚙️ Environment Configuration

### Backend Setup (`backend/.env`)
Create a `.env` file inside the `backend` directory and add the following keys:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ff-arena
JWT_SECRET=your_jwt_secret_token

# Nodemailer configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Razorpay credentials
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Frontend Setup (`frontend/.env`)
Create a `.env` file inside the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

---

## 🏁 Getting Started

### 1. Clone the repository and switch to the chatbot branch
```bash
git clone https://github.com/shaik-sabeel/FF-Arena.git
cd FF-Arena
git checkout chatbot
```

### 2. Install and run Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Install and run Frontend
```bash
cd ../frontend
npm install
npm run dev
```

The web application should now be accessible locally at `http://localhost:5173`.
