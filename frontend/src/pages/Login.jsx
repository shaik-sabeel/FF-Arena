import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

import gsap from 'gsap';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const { login, user } = useContext(AuthContext);
  
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // GSAP animation on mount
  useEffect(() => {
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoadingState(true);
    const result = await login(formData.email, formData.password);
    setLoadingState(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };



  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8">
      <div
        ref={formRef}
        className="glass-panel w-full max-w-md rounded-2xl border border-gaming-border p-8 shadow-card"
      >
        {/* Header Logo */}
        <div className="mb-6 text-center">
          <img
            src="/logo.svg"
            alt="Logo"
            className="mx-auto mb-4 h-16 w-16 drop-shadow-[0_0_12px_rgba(53,213,250,0.6)]"
          />
          <h2 className="text-2xl font-black tracking-wide text-white font-gaming uppercase">
            Welcome to <span className="text-gaming-accent">FF Arena</span>
          </h2>
          <p className="mt-1.5 text-xs text-gaming-text">
            Log in to participate in tournaments and claim prizes
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gaming-text">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gaming-text" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="player@freefire.com"
                className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-3 pr-4 pl-11 text-sm font-medium text-white placeholder-gaming-text/60 outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gaming-text">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gaming-text" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-3 pr-4 pl-11 text-sm font-medium text-white placeholder-gaming-text/60 outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingState}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gaming-accent py-3.5 text-sm font-extrabold text-white shadow-neon transition duration-200 hover:bg-opacity-95 hover:shadow-neon-hover disabled:opacity-50"
          >
            {loadingState ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Enter Arena</span>
                <LogIn size={16} />
              </>
            )}
          </button>
        </form>



        {/* Footer Link */}
        <div className="mt-8 text-center text-xs font-semibold text-gaming-text">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="inline-flex items-center text-gaming-accent hover:underline"
          >
            Create one now <ArrowRight size={12} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
