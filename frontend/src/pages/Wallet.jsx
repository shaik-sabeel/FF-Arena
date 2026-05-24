import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, Plus, Landmark, CheckCircle, AlertTriangle, ShieldCheck, CreditCard, Send } from 'lucide-react';
import gsap from 'gsap';

// Helper to inject Razorpay checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const WalletPage = () => {
  const { user, syncWalletBalance } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Modals state
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  
  // Withdrawal strictly asks for UPI ID
  const [upiId, setUpiId] = useState('');
  
  // Razorpay / Payment states
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showSandboxLoader, setShowSandboxLoader] = useState(false);
  
  // Visual feedbacks
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [processing, setProcessing] = useState(false);

  const balanceCardRef = useRef(null);
  const depositModalRef = useRef(null);
  const withdrawModalRef = useRef(null);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await API.get('/wallet/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load transaction ledger', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Load Razorpay script
    loadRazorpayScript().then((loaded) => {
      setRazorpayLoaded(loaded);
    });
  }, []);

  // GSAP Balance Card pop on mount
  useEffect(() => {
    gsap.fromTo(
      balanceCardRef.current,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.5)' }
    );
  }, []);

  // GSAP Modals transition
  useEffect(() => {
    if (showDeposit && depositModalRef.current) {
      gsap.fromTo(
        depositModalRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [showDeposit]);

  useEffect(() => {
    if (showWithdraw && withdrawModalRef.current) {
      gsap.fromTo(
        withdrawModalRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [showWithdraw]);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      setErrorMsg('Minimum deposit amount is ₹10');
      return;
    }

    setProcessing(true);

    try {
      // 1. Initialize Razorpay order from backend
      const orderRes = await API.post('/wallet/razorpay/order', { amount: parsedAmount });
      
      if (!orderRes.data.success) {
        throw new Error('Order creation failed on server');
      }

      const { orderId, keyId, isSandbox } = orderRes.data;

      // 2. Sandbox bypass verification
      if (isSandbox || !razorpayLoaded) {
        console.log('[Payment] Razorpay keys missing. Simulating sandbox payment...');
        setShowSandboxLoader(true);
        
        setTimeout(async () => {
          try {
            const verifyRes = await API.post('/wallet/razorpay/verify', {
              razorpay_order_id: orderId,
              razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
              amount: parsedAmount
            });

            syncWalletBalance(verifyRes.data.walletBalance);
            setSuccessMsg(`Successfully credited ₹${parsedAmount.toFixed(2)} to wallet! (Sandbox Mode)`);
            setAmount('');
            fetchHistory();
            setShowSandboxLoader(false);
            
            setTimeout(() => {
              setShowDeposit(false);
              setSuccessMsg('');
            }, 1800);
          } catch (verErr) {
            setErrorMsg('Sandbox payment validation failed.');
            setShowSandboxLoader(false);
          }
        }, 1500);

      } else {
        // 3. Open Real Razorpay Checkout modal
        const options = {
          key: keyId,
          amount: orderRes.data.amount,
          currency: 'INR',
          name: 'FF Arena',
          description: 'Wallet Cash Load',
          image: '/logo.svg',
          order_id: orderId,
          handler: async (response) => {
            try {
              setProcessing(true);
              const verifyRes = await API.post('/wallet/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: parsedAmount
              });

              syncWalletBalance(verifyRes.data.walletBalance);
              setSuccessMsg(`Successfully credited ₹${parsedAmount.toFixed(2)} to your wallet!`);
              setAmount('');
              fetchHistory();
              
              setTimeout(() => {
                setShowDeposit(false);
                setSuccessMsg('');
              }, 1800);
            } catch (err) {
              setErrorMsg(err.response?.data?.msg || 'Verification failed. Please contact support.');
            } finally {
              setProcessing(false);
            }
          },
          prefill: {
            name: user.username,
            email: user.email
          },
          theme: {
            color: '#35D5FA'
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.msg || 'Failed to initialize payment gateway.');
      setProcessing(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 150) {
      setErrorMsg('Minimum withdrawal amount is ₹150');
      return;
    }

    if (user.walletBalance < parsedAmount) {
      setErrorMsg('Insufficient wallet balance for withdrawal');
      return;
    }

    if (!upiId) {
      setErrorMsg('Please provide your UPI ID for payout');
      return;
    }

    // Simple UPI regex validation check
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiId)) {
      setErrorMsg('Please enter a valid UPI format (e.g., gamer@ybl, player@paytm)');
      return;
    }

    setProcessing(true);
    try {
      const res = await API.post('/wallet/withdraw', {
        amount: parsedAmount,
        payoutDetails: upiId
      });

      syncWalletBalance(res.data.walletBalance);
      setSuccessMsg(`Withdrawal of ₹${parsedAmount.toFixed(2)} processed to UPI ${upiId}!`);
      setAmount('');
      setUpiId('');
      fetchHistory();

      setTimeout(() => {
        setShowWithdraw(false);
        setSuccessMsg('');
      }, 1800);
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || 'Withdrawal request failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 safe-bottom">
      
      {/* Wallet Balance Display Card */}
      <div
        ref={balanceCardRef}
        className="glass-panel relative mb-8 overflow-hidden rounded-3xl border border-gaming-border p-6 shadow-neon md:p-8"
      >
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gaming-accent/10 blur-3xl" />
        
        <div className="flex flex-col justify-between md:flex-row md:items-center">
          <div className="mb-6 md:mb-0">
            <p className="text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
              <ShieldCheck size={14} className="mr-1 text-gaming-blue" />
              Secured Arena Wallet
            </p>
            <h1 className="mt-2 text-4xl font-black text-white md:text-5xl glow-text-orange font-gaming">
              ₹{user ? user.walletBalance.toFixed(2) : '0.00'}
            </h1>
            <p className="mt-1.5 text-xs text-gaming-text">
              Linked Game UID: <span className="font-mono text-white font-bold">{user?.freeFireId || 'Not Linked'}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setShowDeposit(true);
                setShowWithdraw(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="flex items-center space-x-2 rounded-xl bg-gaming-accent px-5 py-3 text-sm font-extrabold text-black shadow-neon hover:shadow-neon-hover transition"
            >
              <Plus size={18} />
              <span>Razorpay Deposit</span>
            </button>
            
            <button
              onClick={() => {
                setShowWithdraw(true);
                setShowDeposit(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="flex items-center space-x-2 rounded-xl border border-gaming-border bg-gaming-card/60 px-5 py-3 text-sm font-bold text-white transition hover:bg-gaming-border"
            >
              <Landmark size={18} />
              <span>Cash Out UPI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Columns containing modals inline / histories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Left Forms (Modals displayed container) */}
        {(showDeposit || showWithdraw) && (
          <div className="md:col-span-1">
            {/* Deposit Section */}
            {showDeposit && (
              <div
                ref={depositModalRef}
                className="glass-panel rounded-2xl border border-gaming-accent/20 p-5 shadow-neon"
              >
                <div className="mb-4 flex items-center justify-between border-b border-gaming-border pb-2">
                  <h3 className="text-sm font-black uppercase text-white flex items-center">
                    <CreditCard className="mr-1.5 text-gaming-accent" size={16} /> Razorpay Load
                  </h3>
                  <button onClick={() => setShowDeposit(false)} className="text-[10px] font-bold text-gaming-text hover:text-white">
                    Close
                  </button>
                </div>

                {errorMsg && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs font-semibold text-red-400">{errorMsg}</div>}
                {successMsg && <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2 text-xs font-semibold text-green-400 flex items-center"><CheckCircle size={14} className="mr-1"/>{successMsg}</div>}

                {showSandboxLoader ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <span className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gaming-accent border-t-transparent" />
                    <p className="text-xs font-bold text-white">Connecting Razorpay Sandbox...</p>
                    <p className="text-[10px] text-gaming-text mt-1">Authorizing mock credentials</p>
                  </div>
                ) : (
                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">Amount to Deposit (₹)</label>
                      <input
                        type="number"
                        placeholder="Min 10"
                        min="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2 px-3 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                        required
                        disabled={processing}
                      />
                    </div>

                    <div className="rounded-lg bg-gaming-dark/40 border border-gaming-border p-3 text-[10px] text-gaming-text leading-relaxed">
                      Secured checkout via Razorpay. Minimum amount to deposit is ₹10.
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full rounded-xl bg-gaming-accent py-2.5 text-xs font-extrabold text-black shadow-neon hover:shadow-neon-hover transition disabled:opacity-50"
                    >
                      {processing ? 'Connecting Gateway...' : 'Pay with Razorpay'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Withdraw Section */}
            {showWithdraw && (
              <div
                ref={withdrawModalRef}
                className="glass-panel rounded-2xl border border-gaming-blue/20 p-5 shadow-card"
              >
                <div className="mb-4 flex items-center justify-between border-b border-gaming-border pb-2">
                  <h3 className="text-sm font-black uppercase text-white flex items-center">
                    <Landmark className="mr-1.5 text-gaming-blue" size={16} /> Cash Out UPI
                  </h3>
                  <button onClick={() => setShowWithdraw(false)} className="text-[10px] font-bold text-gaming-text hover:text-white">
                    Close
                  </button>
                </div>

                {errorMsg && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs font-semibold text-red-400">{errorMsg}</div>}
                {successMsg && <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2 text-xs font-semibold text-green-400 flex items-center"><CheckCircle size={14} className="mr-1"/>{successMsg}</div>}

                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  {/* Withdrawal Limit warning banner */}
                  <div className="rounded-lg bg-yellow-500/15 border border-yellow-500/20 p-3 text-[10px] text-yellow-500 flex items-start space-x-1.5">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <p>Minimum payout is ₹150. Only UPI ID transfers are supported.</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">Amount to Withdraw (₹)</label>
                    <input
                      type="number"
                      placeholder="Min 150"
                      min="150"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2 px-3 text-sm font-medium text-white outline-none focus:border-gaming-blue"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">Your UPI Address (VPA)</label>
                    <div className="relative">
                      <Send className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gaming-text" />
                      <input
                        type="text"
                        placeholder="e.g. gamer@ybl, name@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 pr-3 pl-9 text-xs font-medium text-white outline-none focus:border-gaming-blue"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-gaming-blue py-2.5 text-xs font-extrabold text-black transition shadow-neon-blue disabled:opacity-50"
                  >
                    {processing ? 'Processing Cashout...' : 'Simulate Payout'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Transaction History ledger */}
        <div className={showDeposit || showWithdraw ? 'md:col-span-2' : 'md:col-span-3'}>
          <div className="glass-panel rounded-2xl border border-gaming-border p-5">
            <h3 className="mb-4 flex items-center text-sm font-bold uppercase tracking-wider text-white">
              <Clock size={16} className="mr-1.5 text-gaming-text" />
              Transaction Ledger
            </h3>

            {loadingHistory ? (
              <div className="flex h-32 flex-col items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-gaming-accent border-t-transparent" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-xs font-semibold text-gaming-text">
                No transactions recorded. Join matches or deposit cash to populate ledger.
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3">
                {history.map((tx) => {
                  const isCredit = ['deposit', 'prize'].includes(tx.type);
                  
                  return (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between rounded-xl bg-gaming-dark/40 border border-gaming-border/60 p-3 hover:border-gaming-border transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            isCredit 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white capitalize">{tx.type.replace('_', ' ')}</p>
                          <p className="text-[10px] text-gaming-text font-medium">{tx.description || 'Transaction'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-sm font-extrabold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </p>
                        <p className="text-[9px] text-gaming-text font-mono">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WalletPage;
