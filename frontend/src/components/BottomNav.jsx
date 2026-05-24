import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Trophy, Wallet, User, Settings } from 'lucide-react';

const BottomNav = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center flex-1 py-2 text-xs font-semibold transition-all ${
      isActive 
        ? 'text-gaming-accent scale-110 glow-text-orange' 
        : 'text-gaming-text hover:text-white'
    }`;

  return (
    <div className="glass-panel fixed bottom-0 left-0 right-0 z-40 border-t border-gaming-border md:hidden">
      <div className="flex items-center justify-around px-2 py-1 pb-safe-bottom">
        <NavLink to="/" className={linkClass}>
          <Home size={20} className="mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/leaderboard" className={linkClass}>
          <Trophy size={20} className="mb-0.5" />
          <span>Ranks</span>
        </NavLink>

        <NavLink to="/wallet" className={linkClass}>
          <Wallet size={20} className="mb-0.5" />
          <span>Wallet</span>
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
          <User size={20} className="mb-0.5" />
          <span>Profile</span>
        </NavLink>

        <NavLink to="/settings" className={linkClass}>
          <Settings size={20} className="mb-0.5" />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
