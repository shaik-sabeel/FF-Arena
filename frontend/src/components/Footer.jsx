import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Gamepad2, ShieldAlert, Award, Smartphone } from 'lucide-react';

const Footer = () => {
  const { user } = useContext(AuthContext);

  return (
    <footer className="relative z-10 mt-16 border-t border-gaming-border bg-black/90 py-8 px-4 md:px-8 text-gaming-text">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Brand details */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="Arena Logo" className="h-8 w-8 drop-shadow-[0_0_8px_rgba(53,213,250,0.6)]" />
              <span className="bg-gradient-neon bg-clip-text text-lg font-black tracking-wider text-transparent font-gaming">
                FF <span className="text-white">ARENA</span>
              </span>
            </Link>
            <p className="text-xs max-w-sm leading-relaxed">
              Competitive Free Fire Tournament and Custom Match Hub. Deploy matches, link your IGN, defeat adversaries, and claim cash rewards directly to your UPI account!
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Lobby Navigation</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <Link to="/" className="hover:text-gaming-accent transition">Home feed</Link>
              <Link to="/leaderboard" className="hover:text-gaming-accent transition">Leaderboard</Link>
              <Link to="/wallet" className="hover:text-gaming-accent transition">Wallet</Link>
              <Link to="/profile" className="hover:text-gaming-accent transition">Gamer Profile</Link>
              <Link to="/settings" className="hover:text-gaming-accent transition">Settings</Link>
            </div>
          </div>

          {/* Legals / Security details */}
          <div className="space-y-3 text-xs leading-normal">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center">
              <ShieldAlert size={14} className="mr-1 text-gaming-accent" />
              Fair Play Policies
            </h4>
            <p>
              Usage of unauthorized hacks, scripts, or ESP tools inside match rooms triggers permanent hardware UID banning. Wallet withdrawals require character validation checks.
            </p>
          </div>

        </div>

        {/* Bottom divider and copyright */}
        <div className="mt-8 border-t border-gaming-border/60 pt-6 flex flex-col items-center justify-between gap-4 text-[10px] sm:flex-row">
          <p>© {new Date().getFullYear()} FF Arena Esports. All rights reserved.</p>
          <div className="flex space-x-4">
            <span className="flex items-center text-gaming-accent">
              <Smartphone size={12} className="mr-1" />
              PWA Standalone ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
