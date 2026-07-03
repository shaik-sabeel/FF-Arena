import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Gamepad2, 
  ShieldAlert, 
  Award, 
  Smartphone, 
  Mail, 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  Building2,
  Calendar
} from 'lucide-react';

const Footer = () => {
  const { user } = useContext(AuthContext);

  const businessName = "BL BATTLE";
  const udyamNumber = "UDYAM-AP-18-0065432";
  const registeredAddress = "Hussainapuram Street, Peapully Mandal, Kurnool District, Andhra Pradesh - 518221";
  const supportEmail = "bloodlinebattle7@gmail.com";
  const supportHours = "10:00 AM - 10:00 PM IST (Mon - Sun)";

  return (
    <footer className="relative z-10 mt-16 border-t border-gaming-border bg-black/90 py-10 px-4 md:px-8 text-gaming-text">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Brand & Business Details */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="Arena Logo" className="h-8 w-8 rounded-md object-cover drop-shadow-[0_0_8px_rgba(53,213,250,0.6)]" />
              <span className="bg-gradient-neon bg-clip-text text-lg font-black tracking-wider text-transparent font-gaming">
                BL <span className="text-white">BATTLE</span>
              </span>
            </Link>
            <p className="text-xs max-w-sm leading-relaxed">
              Competitive skill-based tournament matchroom hub. Register, play Free Fire lobbies, and earn based on performance.
            </p>

            {/* Merchant Details */}
            <div className="space-y-2 pt-2 text-[11px] border-t border-gaming-border/40">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Building2 size={12} className="text-gaming-accent" />
                Merchant Business Details
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Legal Entity:</strong> {businessName}<br />
                <strong className="text-white">Udyam No:</strong> <span className="text-gaming-accent font-semibold">{udyamNumber}</span><br />
                <strong className="text-white">Address:</strong> {registeredAddress}
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Support Hours:</strong> {supportHours}<br />
                <strong className="text-white">Email:</strong> <a href={`mailto:${supportEmail}`} className="text-gaming-accent hover:underline">{supportEmail}</a>
              </p>
            </div>
          </div>

          {/* Quick links & About */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Lobby Navigation</h4>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <Link to="/" className="hover:text-gaming-accent transition w-fit">Home feed</Link>
              <Link to="/leaderboard" className="hover:text-gaming-accent transition w-fit">Leaderboard</Link>
              <Link to="/wallet" className="hover:text-gaming-accent transition w-fit">Wallet Portal</Link>
              <Link to="/profile" className="hover:text-gaming-accent transition w-fit">Gamer Profile</Link>
              <Link to="/settings" className="hover:text-gaming-accent transition w-fit">Settings</Link>
              <Link to="/about" className="hover:text-gaming-accent transition w-fit border-t border-gaming-border/40 pt-1 mt-1 font-semibold text-white">About Us</Link>
              <Link to="/contact" className="hover:text-gaming-accent transition w-fit font-semibold text-white">Contact Us</Link>
            </div>
          </div>

          {/* Privacy & Legal Documents */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Privacy & Terms</h4>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <Link to="/terms" className="hover:text-gaming-accent transition w-fit">Terms & Conditions</Link>
              <Link to="/privacy" className="hover:text-gaming-accent transition w-fit">Privacy Policy</Link>
              <Link to="/refunds" className="hover:text-gaming-accent transition w-fit">Refund & Cancellation</Link>
              <Link to="/shipping" className="hover:text-gaming-accent transition w-fit">Shipping & Delivery</Link>
              <Link to="/disclaimer" className="hover:text-gaming-accent transition w-fit">Skill-Based Disclaimer</Link>
            </div>
          </div>

          {/* Compliance & Fair Play policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Responsible Gaming</h4>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <Link to="/responsible-gaming" className="hover:text-gaming-accent transition w-fit">Responsible Gaming</Link>
              <Link to="/kyc-policy" className="hover:text-gaming-accent transition w-fit">KYC Verification Policy</Link>
              <Link to="/aml-policy" className="hover:text-gaming-accent transition w-fit">AML Policy</Link>
              <Link to="/cookie-policy" className="hover:text-gaming-accent transition w-fit">Cookie Policy</Link>
              <Link to="/community-guidelines" className="hover:text-gaming-accent transition w-fit">Community Guidelines</Link>
              <Link to="/fair-play" className="hover:text-gaming-accent transition w-fit">Fair Play Policy</Link>
            </div>
          </div>

        </div>

        {/* Compliance badges section */}
        <div className="mt-8 pt-6 border-t border-gaming-border/60 flex flex-wrap gap-4 justify-center md:justify-start">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gaming-border/30 border border-gaming-border text-[10px] text-white">
            <ShieldCheck size={14} className="text-green-500" />
            <span>SSL SECURED</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gaming-border/30 border border-gaming-border text-[10px] text-white">
            <Lock size={14} className="text-blue-500" />
            <span>SECURE PAYMENTS</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gaming-border/30 border border-gaming-border text-[10px] text-white">
            <Award size={14} className="text-orange-500" />
            <span>SKILL-BASED COMPETITION</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gaming-border/30 border border-gaming-border text-[10px] text-white">
            <FileCheck size={14} className="text-cyan-500" />
            <span>UDYAM REGISTERED BUSINESS</span>
          </div>
        </div>

        {/* Bottom divider and copyright */}
        <div className="mt-6 pt-4 border-t border-gaming-border/30 flex flex-col items-center justify-between gap-4 text-[10px] sm:flex-row">
          <p>© {new Date().getFullYear()} {businessName} Esports. All rights reserved.</p>
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
