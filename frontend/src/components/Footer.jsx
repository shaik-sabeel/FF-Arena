import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Gamepad2, ShieldAlert, Award, Smartphone, Mail } from 'lucide-react';

const Footer = () => {
  const { user } = useContext(AuthContext);

  return (
    <footer className="relative z-10 mt-16 border-t border-gaming-border bg-black/90 py-8 px-4 md:px-8 text-gaming-text">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Brand details */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="Arena Logo" className="h-8 w-8 rounded-md object-cover drop-shadow-[0_0_8px_rgba(53,213,250,0.6)]" />
              <span className="bg-gradient-neon bg-clip-text text-lg font-black tracking-wider text-transparent font-gaming">
                BL <span className="text-white">BATTLE</span>
              </span>
            </Link>
            <p className="text-xs max-w-sm leading-relaxed">
              Competitive BL Battle Tournament and Custom Match Hub. Deploy matches, link your IGN, defeat adversaries, and claim cash rewards directly to your UPI account!
            </p>

            {/* Social & Contact Links */}
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-white">Contact & Connect</p>
              <div className="flex items-center gap-2">
                <a 
                  href="mailto:bloodlinebattle7@gmail.com" 
                  className="flex items-center gap-1.5 text-xs text-gaming-text hover:text-gaming-accent hover:scale-102 transition-all duration-300 group cursor-pointer"
                >
                  <Mail size={14} className="group-hover:animate-pulse" />
                  <span>bloodlinebattle7@gmail.com</span>
                </a>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-1.5 rounded-lg bg-gaming-border/60 border border-gaming-border hover:border-gaming-accent/40 hover:bg-gaming-accent/15 hover:text-gaming-accent hover:scale-110 active:scale-95 transition-all duration-300 shadow-glass cursor-pointer flex items-center justify-center"
                  title="Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-1.5 rounded-lg bg-gaming-border/60 border border-gaming-border hover:border-gaming-accent/40 hover:bg-gaming-accent/15 hover:text-gaming-accent hover:scale-110 active:scale-95 transition-all duration-300 shadow-glass cursor-pointer flex items-center justify-center"
                  title="Facebook"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              </div>
            </div>
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
          <p>© {new Date().getFullYear()} BL Battle Esports. All rights reserved.</p>
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
