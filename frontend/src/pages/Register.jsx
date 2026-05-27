import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, Gamepad2, ArrowLeft } from 'lucide-react';

import gsap from 'gsap';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    freeFireId: '',
    freeFireName: ''
  });
  const [error, setError] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const { register, user } = useContext(AuthContext);

  const navigate = useNavigate();
  const formRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // GSAP animation
  useEffect(() => {
    gsap.fromTo(
      formRef.current,
      { opacity: 0, scale: 0.95, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }
    );

    // Stagger all form fields on load
    const children = formRef.current.querySelectorAll('.mb-6 > *, form > div, form > button, .text-center');
    gsap.fromTo(
      children,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.25 }
    );
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      setError('Required: Username, Email, Password');
      return;
    }

    setLoadingState(true);
    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.freeFireId,
      formData.freeFireName
    );
    setLoadingState(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };



  return (
    <div 
      className="relative flex min-h-screen items-center justify-center px-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/bg.png')" }}
    >
      {/* Dark blur overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0" />
      
      <div
        ref={formRef}
        className="glass-panel relative z-10 w-full max-w-lg rounded-2xl border border-gaming-border p-8 shadow-card"
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="mx-auto mb-4 h-14 w-14 rounded-2xl object-cover drop-shadow-[0_0_12px_rgba(53,213,250,0.6)]"
          />
          <h2 className="text-2xl font-black tracking-wide text-white font-gaming uppercase">
            Create Gamer Account
          </h2>
          <p className="mt-1 text-xs text-gaming-text">
            Join the premium Free Fire competition platform
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                Username
              </label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gaming-text" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="GamerPro"
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 pr-3 pl-10 text-sm font-medium text-white outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gaming-text" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@gmail.com"
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 pr-3 pl-10 text-sm font-medium text-white outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gaming-text" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Choose a strong password"
                className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 pr-3 pl-10 text-sm font-medium text-white outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                required
              />
            </div>
          </div>

          <div className="border-t border-gaming-border pt-4">
            <h3 className="mb-3 flex items-center text-xs font-bold uppercase tracking-wider text-gaming-accent">
              <Gamepad2 className="mr-1.5 h-4 w-4" />
              Free Fire Details (Optional - Can update later)
            </h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                  Free Fire Character UID
                </label>
                <input
                  type="text"
                  name="freeFireId"
                  value={formData.freeFireId}
                  onChange={handleChange}
                  placeholder="e.g. 876543210"
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3 text-sm font-medium text-white outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                  In-Game Name (IGN)
                </label>
                <input
                  type="text"
                  name="freeFireName"
                  value={formData.freeFireName}
                  onChange={handleChange}
                  placeholder="e.g. FF_Slayer"
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3 text-sm font-medium text-white outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingState}
            className="mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-gaming-accent py-3 text-sm font-extrabold text-white shadow-neon transition duration-200 hover:bg-opacity-95 hover:shadow-neon-hover disabled:opacity-50"
          >
            {loadingState ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Register Account</span>
                <UserPlus size={16} />
              </>
            )}
          </button>
        </form>



        <div className="mt-6 text-center text-xs font-semibold text-gaming-text">
          Already have an account?{' '}
          <Link
            to="/login"
            className="inline-flex items-center text-gaming-accent hover:underline"
          >
            <ArrowLeft size={12} className="mr-1" /> Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
