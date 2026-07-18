import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, Plus, Landmark, CheckCircle, AlertTriangle, ShieldCheck, CreditCard, Send, X } from 'lucide-react';
import gsap from 'gsap';

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
  
  // Manual deposit UTR state
  const [utr, setUtr] = useState('');
  
  // Visual feedbacks
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [processing, setProcessing] = useState(false);

  const balanceCardRef = useRef(null);
  const depositModalRef = useRef(null);
  const withdrawModalRef = useRef(null);
  const ledgerListRef = useRef(null);

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
  }, []);

  // GSAP Balance Card pop on mount
  useEffect(() => {
    gsap.fromTo(
      balanceCardRef.current,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.5)' }
    );
  }, []);

  // GSAP Modals transition
  useEffect(() => {
    if (showDeposit && depositModalRef.current) {
      gsap.fromTo(
        depositModalRef.current,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }
      );
    }
  }, [showDeposit]);

  useEffect(() => {
    if (showWithdraw && withdrawModalRef.current) {
      gsap.fromTo(
        withdrawModalRef.current,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }
      );
    }
  }, [showWithdraw]);

  useEffect(() => {
    if (!loadingHistory && history.length > 0 && ledgerListRef.current) {
      const items = ledgerListRef.current.children;
      gsap.fromTo(
        items,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [loadingHistory, history]);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      setErrorMsg('Minimum deposit amount is ₹10');
      return;
    }

    if (!utr || utr.trim().length < 8) {
      setErrorMsg('Please specify a valid transaction UTR / Reference ID.');
      return;
    }

    setProcessing(true);

    try {
      const res = await API.post('/wallet/manual-deposit', { 
        amount: parsedAmount,
        utr: utr.trim()
      });
      
      setSuccessMsg(res.data.msg);
      setAmount('');
      setUtr('');
      fetchHistory();
      
      setTimeout(() => {
        setShowDeposit(false);
        setSuccessMsg('');
      }, 3500);
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || 'Failed to submit deposit request.');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 50) {
      setErrorMsg('Minimum withdrawal amount is ₹50');
      return;
    }

    if (!user || user.walletBalance < parsedAmount) {
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
      
      {/* Wallet Balance Display Card with Double Neon Cyan-to-Purple Border */}
      <div className="relative p-[1.5px] mb-8 rounded-[28px] bg-gradient-to-r from-gaming-accent via-gaming-purple to-gaming-accent shadow-neon transition duration-300">
        <div className="rounded-[26.5px] p-[1.5px] bg-gradient-to-r from-gaming-purple/40 via-gaming-accent/40 to-gaming-purple/40">
          <div
            ref={balanceCardRef}
            className="glass-panel relative overflow-hidden rounded-[25px] p-6 md:p-8"
          >
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gaming-accent/15 blur-3xl animate-pulse" />
            
            <div className="flex flex-col justify-between md:flex-row md:items-center relative z-10">
              <div className="mb-6 md:mb-0">
                <p className="text-xs font-black uppercase tracking-wider text-gaming-accent flex items-center">
                  <ShieldCheck size={14} className="mr-1.5 text-gaming-accent animate-pulse" />
                  Tournament Credits / Player Balance
                </p>
                <h1 className="mt-2.5 text-4xl font-black text-white md:text-5xl glow-text-orange font-gaming">
                  ₹{user ? user.walletBalance.toFixed(2) : '0.00'}
                </h1>
                <p className="text-[10px] text-gaming-text mt-1 italic">
                  Prize winnings are credited after tournament verification.
                </p>
                <p className="mt-2 text-xs text-gaming-text">
                  Linked Game UID: <span className="font-mono text-white font-black bg-gaming-border/60 px-2 py-0.5 rounded border border-gaming-border">{user?.freeFireId || 'Not Linked'}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3.5">
                <button
                  onClick={() => {
                    setShowDeposit(true);
                    setShowWithdraw(false);
                    setAmount('');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="flex items-center space-x-2 rounded-xl bg-gaming-accent px-5 py-3 text-xs font-black text-black shadow-neon hover:shadow-neon-hover transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Add Tournament Credits</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowWithdraw(true);
                    setShowDeposit(false);
                    setAmount('');
                    setUpiId('');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="flex items-center space-x-2 rounded-xl border border-gaming-border bg-gaming-card/80 px-5 py-3 text-xs font-black text-white transition-all duration-300 hover:bg-gaming-border/80 hover:border-gaming-blue/40 shadow-glass hover:shadow-neon-blue transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Landmark size={16} />
                  <span>Withdraw Winnings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Columns containing histories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Transaction History ledger */}
        <div className="md:col-span-3">
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
              <div ref={ledgerListRef} className="max-h-[350px] overflow-y-auto pr-1 space-y-3">
                {history.map((tx) => {
                  const isCredit = ['deposit', 'prize'].includes(tx.type);
                  
                  const statusColor = 
                    tx.status === 'completed' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                    tx.status === 'pending' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 animate-pulse' :
                    'text-red-400 bg-red-500/10 border-red-500/20';

                  const typeColorBorder = 
                    tx.type === 'deposit' ? 'border-l-gaming-accent' :
                    tx.type === 'prize' ? 'border-l-gaming-gold' :
                    tx.type === 'entry_fee' ? 'border-l-gaming-orange' :
                    'border-l-gaming-purple'; // withdraw

                  const formattedDate = new Date(tx.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={tx._id}
                      className={`flex items-center justify-between rounded-xl bg-gaming-card/40 border border-gaming-border/60 border-l-4 ${typeColorBorder} p-3.5 hover:border-gaming-border hover:bg-gaming-card/80 transition-all duration-300 card-cyber relative overflow-hidden`}
                    >
                      {/* Subtle dashed receipt line inside the block */}
                      <div className="absolute right-24 top-0 bottom-0 border-r border-dashed border-gaming-border/40 hidden sm:block" />

                      <div className="flex items-center space-x-3.5 z-10">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            isCredit 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-black text-white uppercase tracking-wide">{tx.type.replace('_', ' ')}</p>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${statusColor}`}>
                              {tx.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gaming-text font-medium mt-0.5">{tx.description || 'Transaction'}</p>
                          <p className="text-[8px] font-mono text-gaming-text/60 mt-1 uppercase">ID: TXN-{tx._id.slice(-8)}</p>
                        </div>
                      </div>

                      <div className="text-right z-10 pr-2">
                        <p className={`text-sm font-black ${isCredit ? 'text-green-400 glow-text-blue' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </p>
                        <p className="text-[9px] text-gaming-text font-mono mt-1">
                          {formattedDate}
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

      {/* Deposit Modal Backdrop */}
      {showDeposit && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setShowDeposit(false)}
        >
          <div
            ref={depositModalRef}
            className="w-full max-w-md glass-panel rounded-2xl border border-gaming-accent/20 p-6 shadow-neon"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-gaming-border pb-3">
              <h3 className="text-sm font-black uppercase text-white flex items-center">
                <CreditCard className="mr-1.5 text-gaming-accent" size={16} /> Add Tournament Credits
              </h3>
              <button 
                onClick={() => setShowDeposit(false)} 
                className="rounded-lg bg-gaming-border/60 p-1 text-gaming-text hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {errorMsg && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs font-semibold text-red-400">{errorMsg}</div>}
            {successMsg && <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-xs font-semibold text-green-400 flex items-center"><CheckCircle size={14} className="mr-1"/>{successMsg}</div>}

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="flex flex-col items-center space-y-2 rounded-xl bg-gaming-dark/60 border border-gaming-border p-4">
                <p className="text-[10px] font-black uppercase text-gaming-accent tracking-wider">Scan QR to pay admin</p>
                <img
                  src="/qr_durga.png"
                  alt="Admin UPI Payment QR Code"
                  className="w-64 h-auto object-contain rounded-lg border border-gaming-border bg-white p-1.5 shadow-md"
                />
                <div className="text-center">
                  <p className="text-[10px] font-extrabold text-white">
                    Account Name: <span className="text-gaming-accent">PEDDA PUJARLA KAMMA DURGA PRASAD</span>
                  </p>
                  <p className="text-[9px] text-gaming-text mt-0.5">Pay via PhonePe, Google Pay, or Paytm UPI</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">Amount Deposited (₹)</label>
                <input
                  type="number"
                  placeholder="Min 10"
                  min="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                  required
                  disabled={processing}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">Transaction UTR / Ref ID (12 Digits)</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. 612345678901"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                  required
                  disabled={processing}
                />
              </div>

              <button
                type="submit"
                disabled={processing || utr.length < 8}
                className="w-full rounded-xl bg-gaming-accent py-2.5 text-xs font-extrabold text-black shadow-neon hover:shadow-neon-hover transition disabled:opacity-50"
              >
                {processing ? 'Submitting request...' : 'Submit Deposit Receipt'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal Backdrop */}
      {showWithdraw && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setShowWithdraw(false)}
        >
          <div
            ref={withdrawModalRef}
            className="w-full max-w-md glass-panel rounded-2xl border border-gaming-blue/20 p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-gaming-border pb-3">
              <h3 className="text-sm font-black uppercase text-white flex items-center">
                <Landmark className="mr-1.5 text-gaming-blue" size={16} /> Withdraw Winnings
              </h3>
              <button 
                onClick={() => setShowWithdraw(false)} 
                className="rounded-lg bg-gaming-border/60 p-1 text-gaming-text hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {errorMsg && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs font-semibold text-red-400">{errorMsg}</div>}
            {successMsg && <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-xs font-semibold text-green-400 flex items-center"><CheckCircle size={14} className="mr-1"/>{successMsg}</div>}

            {user?.kycStatus !== 'verified' ? (
              <div className="space-y-4 py-4 text-center">
                <AlertTriangle size={36} className="text-yellow-500 mx-auto animate-pulse" />
                <h4 className="text-white font-bold text-sm uppercase">KYC Verification Required</h4>
                <p className="text-xs text-gaming-text leading-relaxed">
                  Under compliance guidelines, you must verify your identity before initiating withdrawals. Your current KYC status is <span className="text-yellow-500 font-bold uppercase">{user?.kycStatus || 'unverified'}</span>.
                </p>
                <div className="pt-2">
                  <Link 
                    to="/settings"
                    onClick={() => setShowWithdraw(false)}
                    className="inline-block rounded-xl bg-gaming-blue px-6 py-2.5 text-xs font-black text-black transition shadow-neon-blue cursor-pointer"
                  >
                    Complete KYC in Settings
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="rounded-lg bg-yellow-500/15 border border-yellow-500/20 p-3 text-[10px] text-yellow-500 flex items-start space-x-1.5">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <p>Minimum payout is ₹50. Only UPI ID transfers are supported.</p>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gaming-text">Amount to Withdraw (₹)</label>
                  <input
                    type="number"
                    placeholder="Min 50"
                    min="50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-blue"
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
                  {processing ? 'Processing Payout...' : 'Request Payout'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default WalletPage;
