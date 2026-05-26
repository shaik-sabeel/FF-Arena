import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getDeferredPrompt, clearDeferredPrompt } from '../registerServiceWorker';
import { Gamepad2, Settings, Monitor, Phone, Download, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';

const SettingsPage = () => {
  const { user, updateProfile } = useContext(AuthContext);
  
  // Profile Form States
  const [freeFireId, setFreeFireId] = useState(user?.freeFireId || '');
  const [freeFireName, setFreeFireName] = useState(user?.freeFireName || '');
  const [role, setRole] = useState(user?.role || 'user');
  
  // Feedbacks
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // PWA States
  const [installPrompt, setInstallPrompt] = useState(getDeferredPrompt());
  const [isInstalled, setIsInstalled] = useState(false);

  const containerRef = useRef(null);

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
    return () => window.removeEventListener('pwaInstallPromptReady', handlePrompt);
  }, []);

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
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!freeFireId || !freeFireName) {
      setErrorMsg('Please specify both Character ID and IGN');
      return;
    }

    setSaving(true);
    const res = await updateProfile(freeFireId, freeFireName, role);
    setSaving(false);

    if (res.success) {
      setSuccessMsg('Game profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    
    // Trigger installation dialog
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We've used the prompt, clear it
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

        {/* PWA Mobile Shortcut Installer Panel */}
        <div className="glass-panel rounded-2xl border border-gaming-accent/20 p-5 shadow-neon">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-white flex items-center">
            <Download className="mr-1.5 text-gaming-accent" size={16} />
            Mobile App Shortcut
          </h2>
          <p className="mb-4 text-xs text-gaming-text">
            Add FF Arena to your phone home screen to launch it directly as a full-screen, native-like gaming application.
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

        {/* Profile Details Edit Form */}
        <div className="glass-panel rounded-2xl border border-gaming-border p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white border-b border-gaming-border pb-2 flex items-center">
            <Gamepad2 className="mr-1.5 text-gaming-blue" size={16} /> Link Character profile
          </h2>

          {errorMsg && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs font-semibold text-red-400">{errorMsg}</div>}
          {successMsg && <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-xs font-semibold text-green-400 flex items-center"><CheckCircle size={14} className="mr-1"/>{successMsg}</div>}

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
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gaming-blue px-5 py-3 text-xs font-black text-black shadow-neon-blue hover:shadow-[0_0_20px_rgba(0,102,255,0.6)] hover:bg-gaming-blue/95 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none cursor-pointer"
            >
              {saving ? 'Saving details...' : 'Save Character Link'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
