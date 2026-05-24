import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import IntroScreen from './components/IntroScreen';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Wallet from './pages/Wallet';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import TournamentDetails from './pages/TournamentDetails';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gaming-dark text-white">
        <span className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gaming-accent border-t-transparent" />
        <p className="font-gaming text-sm font-bold uppercase tracking-wider text-gaming-text">
          Loading gamer profile...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main Layout Wrapper
const AppLayout = () => {
  const { user, loading } = useContext(AuthContext);
  const [introActive, setIntroActive] = useState(true);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gaming-dark text-white">
        <span className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gaming-accent border-t-transparent" />
        <p className="font-gaming text-sm font-bold uppercase tracking-wider text-gaming-text">
          Loading Arena...
        </p>
      </div>
    );
  }

  // Renders Intro Screen first on site visit
  if (introActive) {
    return <IntroScreen onComplete={() => setIntroActive(false)} />;
  }

  return (
    <div className="min-h-screen bg-gaming-dark flex flex-col pb-16 md:pb-0">
      {/* Desktop Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournament/:id"
            element={
              <ProtectedRoute>
                <TournamentDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Main Footer */}
      <Footer />

      {/* Mobile Sticky Navigation Dock */}
      <BottomNav />
    </div>
  );
};

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-google-client-id.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
