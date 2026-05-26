import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import API from '../utils/api';

import gsap from 'gsap';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const { login, user } = useContext(AuthContext);
  
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Forgot Password States
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP/Password, 3: Success
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await API.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess(res.data.msg);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.msg || 'Failed to request password reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setForgotError('Please enter both the OTP code and your new password');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await API.post('/auth/reset-password', {
        email: forgotEmail,
        otp,
        newPassword
      });
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.response?.data?.msg || 'Failed to reset password. Please check OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

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

        {forgotMode ? (
          <div>
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black tracking-wide text-white font-gaming uppercase">
                Reset <span className="text-gaming-accent">Password</span>
              </h2>
              <p className="mt-1.5 text-xs text-gaming-text">
                {forgotStep === 1 && "Enter your registered email to receive a recovery code"}
                {forgotStep === 2 && "Enter the 6-digit OTP code and select a new password"}
                {forgotStep === 3 && "Your password has been successfully configured"}
              </p>
            </div>

            {/* Error Notification */}
            {forgotError && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400">
                {forgotError}
              </div>
            )}

            {/* Step 1: Input Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotEmailSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gaming-text" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                      placeholder="player@freefire.com"
                      className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-3 pr-4 pl-11 text-sm font-medium text-white placeholder-gaming-text/60 outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gaming-accent py-3.5 text-sm font-extrabold text-white shadow-neon transition duration-200 hover:bg-opacity-95 hover:shadow-neon-hover disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Send Recovery OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Input OTP & New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                {forgotSuccess && (
                  <div className="mb-3 rounded-lg border border-green-500/20 bg-green-500/10 px-3.5 py-2.5 text-xs font-semibold text-green-400">
                    {forgotSuccess}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                    Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setForgotError(''); }}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-3 px-4 text-sm font-medium text-white text-center tracking-[4px] outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                    Choose New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gaming-text" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setForgotError(''); }}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-3 pr-4 pl-11 text-sm font-medium text-white placeholder-gaming-text/60 outline-none transition focus:border-gaming-accent focus:bg-gaming-dark focus:shadow-neon"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gaming-blue py-3.5 text-sm font-extrabold text-black shadow-neon-blue transition duration-200 hover:bg-opacity-95 disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  ) : (
                    <span>Configure New Password</span>
                  )}
                </button>
              </form>
            )}

            {/* Step 3: Success Screen */}
            {forgotStep === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/25">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-sm font-bold text-white uppercase">Credentials Updated</h4>
                <p className="text-xs text-gaming-text max-w-xs mx-auto">
                  Your new password is fully configured. You can now use your email to access the Arena dashboard.
                </p>
                <button
                  onClick={() => {
                    setForgotMode(false);
                    setForgotStep(1);
                    setForgotEmail('');
                    setOtp('');
                    setNewPassword('');
                    setForgotError('');
                    setDevOtpMsg('');
                  }}
                  className="rounded-xl border border-gaming-border bg-gaming-card/45 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-gaming-border"
                >
                  Back to Log In
                </button>
              </div>
            )}

            {/* Back to Login Link */}
            {forgotStep !== 3 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setForgotMode(false);
                    setForgotStep(1);
                    setForgotError('');
                  }}
                  className="inline-flex items-center text-xs font-bold text-gaming-text hover:text-white transition"
                >
                  <ArrowLeft size={13} className="mr-1.5" /> Back to Log In
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
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
                <div className="flex items-center justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setForgotStep(1);
                      setForgotError('');
                    }}
                    className="text-xs font-semibold text-gaming-accent hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
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
          </div>
        )}



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
