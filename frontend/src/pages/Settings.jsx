import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { getDeferredPrompt, clearDeferredPrompt } from '../registerServiceWorker';
import { 
  Gamepad2, 
  Settings, 
  Monitor, 
  Phone, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  LogOut, 
  UserCheck, 
  FileText, 
  Upload, 
  X,
  CreditCard,
  User,
  Clock,
  ShieldAlert
} from 'lucide-react';
import gsap from 'gsap';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, refreshUser } = useContext(AuthContext);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Profile Form States
  const [freeFireId, setFreeFireId] = useState(user?.freeFireId || '');
  const [freeFireName, setFreeFireName] = useState(user?.freeFireName || '');
  const [role, setRole] = useState(user?.role || 'user');
  
  // Feedbacks for Profile Profile
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // KYC Form States
  const [kycFullName, setKycFullName] = useState(user?.kycDetails?.fullName || '');
  const [kycDob, setKycDob] = useState(
    user?.kycDetails?.dob ? new Date(user.kycDetails.dob).toISOString().split('T')[0] : ''
  );
  const [kycUpi, setKycUpi] = useState(user?.kycDetails?.upiId || '');
  
  // KYC Feedbacks
  const [kycError, setKycError] = useState('');
  const [kycSuccess, setKycSuccess] = useState('');
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Admin Pending KYC review list
  const [pendingKycs, setPendingKycs] = useState([]);
  const [loadingKycs, setLoadingKycs] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState({}); // { [userId]: String }

  // Manual deposit review states
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  // PWA States
  const [installPrompt, setInstallPrompt] = useState(getDeferredPrompt());
  const [isInstalled, setIsInstalled] = useState(false);

  const containerRef = useRef(null);

  // Fetch pending list for host/admin
  const fetchPendingKycs = async () => {
    if (user && (user.role === 'host' || user.role === 'admin')) {
      try {
        setLoadingKycs(true);
        const res = await API.get('/user/kyc/pending');
        setPendingKycs(res.data);
      } catch (err) {
        console.error('Failed to load pending KYCs', err);
      } finally {
        setLoadingKycs(false);
      }
    }
  };

  const fetchPendingDeposits = async () => {
    if (user && user.role === 'admin') {
      try {
        setLoadingDeposits(true);
        const res = await API.get('/wallet/pending-deposits');
        setPendingDeposits(res.data);
      } catch (err) {
        console.error('Failed to load pending deposits', err);
      } finally {
        setLoadingDeposits(false);
      }
    }
  };

  const handleApproveDeposit = async (transactionId) => {
    try {
      await API.put(`/wallet/transactions/${transactionId}/approve`);
      setKycSuccess('Manual deposit request approved successfully!');
      fetchPendingDeposits();
      setTimeout(() => setKycSuccess(''), 3000);
    } catch (err) {
      setKycError(err.response?.data?.msg || 'Failed to approve deposit');
      setTimeout(() => setKycError(''), 3000);
    }
  };

  const handleRejectDeposit = async (transactionId) => {
    if (!window.confirm('Are you sure you want to REJECT this deposit request?')) return;
    try {
      await API.put(`/wallet/transactions/${transactionId}/reject`);
      setKycSuccess('Manual deposit request rejected.');
      fetchPendingDeposits();
      setTimeout(() => setKycSuccess(''), 3000);
    } catch (err) {
      setKycError(err.response?.data?.msg || 'Failed to reject deposit');
      setTimeout(() => setKycError(''), 3000);
    }
  };

  useEffect(() => {
    // Check if app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    // Listen for custom install event
    const handlePrompt = (e) => {
      setInstallPrompt(e.detail);
    };

    window.addEventListener('pwaInstallPromptReady', handlePrompt);
    fetchPendingKycs();
    fetchPendingDeposits();

    return () => window.removeEventListener('pwaInstallPromptReady', handlePrompt);
  }, [user?.role]);

  // GSAP animation
  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    
    if (!freeFireId || !freeFireName) {
      setProfileError('Please specify both Character ID and IGN');
      return;
    }

    setSavingProfile(true);
    const res = await updateProfile(freeFireId, freeFireName, role);
    setSavingProfile(false);

    if (res.success) {
      setProfileSuccess('Game profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 2000);
    } else {
      setProfileError(res.error);
    }
  };

  // KYC Submit Handler
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setKycError('');
    setKycSuccess('');

    if (!kycFullName || !kycDob || !kycUpi) {
      setKycError('Please complete all required fields.');
      return;
    }

    // Basic UPI ID validation
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(kycUpi)) {
      setKycError('Please enter a valid UPI ID (VPA) format (e.g. name@upi, gamer@ybl).');
      return;
    }

    setSubmittingKyc(true);
    try {
      await API.post('/user/kyc', {
        fullName: kycFullName,
        dob: kycDob,
        pan: '',
        documentType: 'Self Declaration',
        documentUrl: 'self_declared',
        upiId: kycUpi
      });

      setKycSuccess('Verification profile details submitted successfully! Awaiting Host verification.');
      await refreshUser(); // Sync user state in context
    } catch (err) {
      setKycError(err.response?.data?.msg || 'KYC submission failed. Please try again.');
    } finally {
      setSubmittingKyc(false);
    }
  };

  // Admin Resolve KYC
  const handleResolveKyc = async (userId, status) => {
    setKycError('');
    setKycSuccess('');

    const rejectionReason = rejectionReasons[userId] || '';
    if (status === 'rejected' && !rejectionReason.trim()) {
      alert('Please specify a rejection reason before rejecting.');
      return;
    }

    try {
      await API.put(`/user/${userId}/verify-kyc`, {
        status,
        rejectionReason
      });

      // Refresh listings
      fetchPendingKycs();
      await refreshUser();
      alert(`KYC status updated to: ${status}`);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update KYC status.');
    }
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setInstallPrompt(null);
    clearDeferredPrompt();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 safe-bottom">
      <div ref={containerRef} className="space-y-6">
        
        {/* Title */}
        <div className="mb-6 flex items-center space-x-2">
          <Settings className="text-gaming-accent h-6 w-6" />
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">Settings</h1>
        </div>

        {/* KYC Compliance Verification Form */}
        <div className="glass-panel rounded-2xl border border-gaming-border p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white border-b border-gaming-border pb-2 flex items-center">
            <UserCheck className="mr-1.5 text-gaming-accent" size={16} />
            Identity KYC Compliance
          </h2>

          {/* Status Banners */}
          {user?.kycStatus === 'verified' && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/25 p-4 text-xs font-bold text-green-400">
              <ShieldCheck size={18} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="uppercase tracking-wider">KYC Verification Completed</p>
                <p className="text-[10px] font-medium text-gaming-text mt-0.5">Your profile is fully verified for cash payouts to: <span className="font-mono text-white font-black">{user.kycDetails?.upiId}</span></p>
              </div>
            </div>
          )}

          {user?.kycStatus === 'pending' && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/25 p-4 text-xs font-bold text-yellow-500 animate-pulse">
              <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
              <div>
                <p className="uppercase tracking-wider">KYC Verification Pending</p>
                <p className="text-[10px] font-medium text-gaming-text mt-0.5">We are currently reviewing your documents. Payouts will unlock upon verification approval.</p>
              </div>
            </div>
          )}

          {user?.kycStatus === 'rejected' && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-xs font-bold text-red-400">
              <X size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="uppercase tracking-wider">KYC Verification Rejected</p>
                <p className="text-[10px] font-medium text-red-300 mt-1">Reason: "{user.kycDetails?.rejectionReason}"</p>
                <p className="text-[10px] font-medium text-gaming-text mt-1">Please review the details below, correct the errors, and re-submit your compliance profile.</p>
              </div>
            </div>
          )}

          {kycError && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs font-semibold text-red-400">{kycError}</div>}
          {kycSuccess && <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-xs font-semibold text-green-400 flex items-center"><CheckCircle size={14} className="mr-1"/>{kycSuccess}</div>}

          {/* KYC Form */}
          {user?.kycStatus !== 'verified' && user?.kycStatus !== 'pending' && (
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div className="rounded-lg bg-gaming-dark/40 border border-gaming-border p-3 text-[10px] text-gaming-text leading-relaxed">
                RBI Compliance Notice: KYC verification is legally mandatory for cash reward match lobbies. Your information is encrypted and never shared.
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">
                    Legal Full Name (Matching Document)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shaik Sabeel"
                    value={kycFullName}
                    onChange={(e) => setKycFullName(e.target.value)}
                    className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/40 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent focus:bg-gaming-dark/60"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="date"
                    value={kycDob}
                    onChange={(e) => setKycDob(e.target.value)}
                    className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/40 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent focus:bg-gaming-dark/60"
                    required
                  />
                </div>



                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">
                    UPI Address for Payouts
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. sabeel@ybl, support@paytm"
                    value={kycUpi}
                    onChange={(e) => setKycUpi(e.target.value)}
                    className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/40 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent focus:bg-gaming-dark/60"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingKyc}
                className="w-full rounded-xl bg-gaming-accent py-3 text-xs font-black text-black shadow-neon hover:shadow-neon-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingKyc ? 'Submitting Verification...' : 'Submit Verification Profile'}
              </button>
            </form>
          )}
        </div>

        {/* KYC Admin Verification Review Board (Visible to host/admin only) */}
        {(user?.role === 'host' || user?.role === 'admin') && (
          <div className="glass-panel rounded-2xl border border-gaming-border p-5 bg-gaming-purple/5 shadow-glass-purple">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white border-b border-gaming-border pb-2 flex items-center">
              <ShieldAlert className="mr-1.5 text-gaming-purple" size={16} />
              Host Board: KYC Pending Lobbies ({pendingKycs.length})
            </h2>

            {loadingKycs ? (
              <div className="flex h-20 items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-gaming-purple border-t-transparent" />
              </div>
            ) : pendingKycs.length === 0 ? (
              <p className="text-xs text-gaming-text py-4 text-center">No pending user KYC submissions in pipeline.</p>
            ) : (
              <div className="space-y-4">
                {pendingKycs.map((item) => (
                  <div key={item._id} className="rounded-xl border border-gaming-border bg-gaming-card/65 p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-gaming-border/60 pb-2">
                      <p className="font-bold text-white">User: <span className="text-gaming-accent">{item.username}</span></p>
                      <p className="text-[10px] text-gaming-text">Submitted: {new Date(item.kycDetails?.submittedAt).toLocaleDateString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gaming-text">
                      <p><strong>Legal Name:</strong> <span className="text-white font-semibold">{item.kycDetails?.fullName}</span></p>
                      <p><strong>DOB:</strong> <span className="text-white font-semibold">{new Date(item.kycDetails?.dob).toLocaleDateString()}</span></p>
                      <p className="col-span-2"><strong>UPI ID:</strong> <span className="text-white font-semibold font-mono">{item.kycDetails?.upiId}</span></p>
                    </div>

                    {/* Rejection input */}
                    <div className="pt-2">
                      <input 
                        type="text" 
                        placeholder="Rejection reason (required if rejecting)" 
                        value={rejectionReasons[item._id] || ''}
                        onChange={(e) => setRejectionReasons({
                          ...rejectionReasons,
                          [item._id]: e.target.value
                        })}
                        className="w-full rounded-lg border border-gaming-border bg-gaming-dark/60 py-1.5 px-3 text-[10px] text-white outline-none focus:border-gaming-purple mb-2"
                      />

                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleResolveKyc(item._id, 'verified')}
                          className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 py-1.5 text-[10px] font-bold text-white transition cursor-pointer"
                        >
                          Approve KYC
                        </button>
                        <button
                          onClick={() => handleResolveKyc(item._id, 'rejected')}
                          className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 py-1.5 text-[10px] font-bold text-white transition cursor-pointer"
                        >
                          Reject KYC
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Wallet Refills Approval Board (Visible to admin only) */}
        {user?.role === 'admin' && (
          <div className="glass-panel rounded-2xl border border-gaming-border p-5 bg-gaming-accent/5 shadow-glass-cyan">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white border-b border-gaming-border pb-2 flex items-center">
              <Clock className="mr-1.5 text-gaming-accent" size={16} />
              Admin Board: Wallet Deposits Review ({pendingDeposits.length})
            </h2>

            {loadingDeposits ? (
              <div className="flex h-20 items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-gaming-accent border-t-transparent" />
              </div>
            ) : pendingDeposits.length === 0 ? (
              <p className="text-xs text-gaming-text py-4 text-center">No pending wallet refills in queue.</p>
            ) : (
              <div className="space-y-4">
                {pendingDeposits.map((item) => (
                  <div key={item._id} className="rounded-xl border border-gaming-border bg-gaming-card/65 p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-gaming-border/60 pb-2">
                      <p className="font-bold text-white">User: <span className="text-gaming-accent">@{item.user?.username}</span></p>
                      <p className="text-[10px] text-gaming-text">Requested: {new Date(item.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gaming-text">
                      <p><strong>Free Fire IGN:</strong> <span className="text-white font-semibold">{item.user?.freeFireName || 'N/A'}</span></p>
                      <p><strong>Refill Amount:</strong> <span className="text-gaming-accent font-extrabold text-sm">₹{item.amount}</span></p>
                      <p className="col-span-2"><strong>Transaction UTR:</strong> <span className="text-gaming-yellow font-mono font-black text-sm select-all tracking-wider">{item.description?.split('UTR: ')[1]?.replace(')', '') || 'N/A'}</span></p>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button
                        onClick={() => handleRejectDeposit(item._id)}
                        className="flex-1 rounded-lg bg-red-600/20 border border-red-500/35 hover:bg-red-600/35 py-1.5 text-[10px] font-bold text-red-400 transition cursor-pointer"
                      >
                        Reject Receipt
                      </button>
                      <button
                        onClick={() => handleApproveDeposit(item._id)}
                        className="flex-1 rounded-lg bg-green-500/20 border border-green-400/35 hover:bg-green-500/35 py-1.5 text-[10px] font-bold text-green-400 transition cursor-pointer"
                      >
                        Approve Refill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Details Edit Form */}
        <div className="glass-panel rounded-2xl border border-gaming-border p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white border-b border-gaming-border pb-2 flex items-center">
            <Gamepad2 className="mr-1.5 text-gaming-blue" size={16} /> Link Character profile
          </h2>

          {profileError && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs font-semibold text-red-400">{profileError}</div>}
          {profileSuccess && <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-xs font-semibold text-green-400 flex items-center"><CheckCircle size={14} className="mr-1"/>{profileSuccess}</div>}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">
                  Free Fire Character UID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 192837465"
                  value={freeFireId}
                  onChange={(e) => setFreeFireId(e.target.value)}
                  className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/40 backdrop-blur-md py-2.5 px-3.5 text-sm font-medium text-white outline-none transition-all duration-300 focus:border-gaming-accent focus:bg-gaming-dark/60 focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">
                  In-Game Name (IGN)
                </label>
                <input
                  type="text"
                  placeholder="e.g. FF_Gladiator"
                  value={freeFireName}
                  onChange={(e) => setFreeFireName(e.target.value)}
                  className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/40 backdrop-blur-md py-2.5 px-3.5 text-sm font-medium text-white outline-none transition-all duration-300 focus:border-gaming-accent focus:bg-gaming-dark/60 focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                  required
                />
              </div>

              {user?.role === 'admin' && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">
                    Simulation User Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/40 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent focus:bg-gaming-dark/60"
                  >
                    <option value="user" className="bg-gaming-dark">Standard User</option>
                    <option value="host" className="bg-gaming-dark">Tournament Host / Admin</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-xl bg-gaming-blue px-5 py-3 text-xs font-black text-black shadow-neon-blue hover:shadow-[0_0_20px_rgba(0,102,255,0.6)] hover:bg-gaming-blue/95 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none cursor-pointer"
            >
              {savingProfile ? 'Saving details...' : 'Save Character Link'}
            </button>
          </form>
        </div>

        {/* PWA Mobile Shortcut Installer Panel */}
        <div className="glass-panel rounded-2xl border border-gaming-accent/20 p-5 shadow-neon">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-white flex items-center">
            <Download className="mr-1.5 text-gaming-accent" size={16} />
            Mobile App Shortcut
          </h2>
          <p className="mb-4 text-xs text-gaming-text">
            Add BL Battle to your phone home screen to launch it directly as a full-screen, native-like gaming application.
          </p>

          {isInstalled ? (
            <div className="flex items-center space-x-2 rounded-xl bg-green-500/10 border border-green-500/25 p-4 text-xs font-bold text-green-400">
              <CheckCircle size={16} />
              <span>App is currently running as a standalone mobile application!</span>
            </div>
          ) : installPrompt ? (
            <div className="flex flex-col justify-between rounded-xl bg-gaming-dark/60 border border-gaming-border p-4 sm:flex-row sm:items-center">
              <div className="mb-4 sm:mb-0">
                <p className="text-xs font-bold text-white">Create Home Shortcut App</p>
                <p className="text-[10px] text-gaming-text">Click below to start instant PWA installer configuration</p>
              </div>
              <button
                onClick={handleInstallApp}
                className="flex items-center justify-center space-x-2 rounded-xl bg-gaming-accent px-5 py-2.5 text-xs font-black text-black shadow-neon hover:shadow-neon-hover hover:scale-[1.02] active:scale-100 transition-all duration-300 cursor-pointer"
              >
                <Download size={14} strokeWidth={3} />
                <span>Install Application</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-gaming-dark/40 border border-gaming-border p-4 space-y-3.5">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle size={16} className="mt-0.5 text-gaming-yellow flex-shrink-0" />
                <p className="text-xs text-gaming-text leading-normal">
                  PWA installer banner is currently unavailable. You can install it manually:
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-xs text-gaming-text md:grid-cols-2">
                <div className="rounded-lg bg-gaming-card p-3 border border-gaming-border/40">
                  <p className="font-bold text-white flex items-center mb-1">
                    <Phone size={13} className="mr-1 text-gaming-blue" /> Android Chrome
                  </p>
                  <p className="text-[10px] leading-relaxed">
                    Click the browser 3-dots menu at the top right, select <strong>"Add to Home Screen"</strong> or <strong>"Install app"</strong>.
                  </p>
                </div>
                <div className="rounded-lg bg-gaming-card p-3 border border-gaming-border/40">
                  <p className="font-bold text-white flex items-center mb-1">
                    <Phone size={13} className="mr-1 text-gaming-accent" /> iOS Safari
                  </p>
                  <p className="text-[10px] leading-relaxed">
                    Tap the <strong>"Share"</strong> icon at the bottom browser bar, scroll down and click <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Session Panel */}
        <div className="glass-panel rounded-2xl border border-gaming-border p-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-white flex items-center">
            <LogOut className="mr-1.5 text-red-500" size={16} />
            Account Session
          </h2>
          <p className="mb-4 text-xs text-gaming-text">
            Logout of your active session on this device. You will need your credentials to log back in.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-2.5 text-xs font-black text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout Account</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
