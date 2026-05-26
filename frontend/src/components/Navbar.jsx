import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Wallet, LogOut, User, Gamepad2, Trophy, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `relative flex items-center space-x-1.5 py-1 text-sm font-semibold transition-all ${
      isActive 
        ? 'text-gaming-accent scale-105 glow-text-blue' 
        : 'text-gaming-text hover:text-white'
    }`;

  const renderNavLink = (to, icon, label) => (
    <NavLink to={to} className={linkClass}>
      {({ isActive }) => (
        <>
          {icon}
          <span>{label}</span>
          {isActive && (
            <span className="absolute bottom-[-14px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gaming-accent shadow-neon animate-pulse" />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <nav className="glass-panel sticky top-0 z-40 w-full border-b border-gaming-border px-4 py-3 md:px-8 shadow-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.svg" alt="Arena Logo" className="h-9 w-9 drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
          <span className="bg-gradient-neon bg-clip-text text-xl font-extrabold tracking-wider text-transparent font-gaming">
            FF <span className="text-white">ARENA</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        {user && (
          <div className="hidden items-center space-x-8 md:flex">
            {renderNavLink('/', <Gamepad2 size={16} />, 'Tournaments')}
            {renderNavLink('/leaderboard', <Trophy size={16} />, 'Leaderboard')}
            {renderNavLink('/wallet', <Wallet size={16} />, 'Wallet')}
            {renderNavLink('/profile', <User size={16} />, 'Profile')}
            {renderNavLink('/settings', <Settings size={16} />, 'Settings')}
          </div>
        )}

        {/* User Action Items / Wallet Balance */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Glowing Wallet Badge */}
              <Link
                to="/wallet"
                className="flex items-center space-x-2 rounded-full border border-gaming-accent/20 bg-gaming-accent/10 px-3.5 py-1.5 text-sm font-bold text-gaming-accent transition-all hover:bg-gaming-accent hover:text-white hover:shadow-neon"
              >
                <span className="h-2 w-2 rounded-full bg-gaming-accent animate-pulse" />
                <span>₹{user.walletBalance.toFixed(2)}</span>
              </Link>

              {/* User Dropdown/Profile Avatar or Logout */}
              <button
                onClick={handleLogout}
                className="hidden items-center space-x-1 rounded-lg border border-gaming-border px-3 py-1.5 text-xs font-semibold text-gaming-text transition hover:bg-gaming-border hover:text-white md:flex"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-sm font-semibold text-gaming-text hover:text-white">
                Log In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gaming-accent px-4 py-2 text-sm font-bold text-white shadow-neon transition hover:bg-opacity-90 hover:shadow-neon-hover"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
