import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import TournamentCard from '../components/TournamentCard';
import SparkParticles from '../components/SparkParticles';
import { Gamepad2, Plus, Calendar, Coins, ShieldAlert, Users, Award, Map, RefreshCw, Eye } from 'lucide-react';
import gsap from 'gsap';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('All');
  
  // 3D Photo Carousel states
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = [
    '/images/slide1.png',
    '/images/slide2.png',
    '/images/slide3.png'
  ];

  // Host Form states
  const [showHostForm, setShowHostForm] = useState(false);
  const [hostError, setHostError] = useState('');
  const [hostSuccess, setHostSuccess] = useState('');
  const [submittingHost, setSubmittingHost] = useState(false);

  // Tournament Form Data State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gameMode: 'BR Ranked',
    map: 'Bermuda',
    entryFee: '0',
    prizePool: '100',
    slots: '48',
    matchDateTime: '',
    winnerCount: '1',
    maxObservers: '5',
    observerReward: '0',
    perKillReward: '0',
    prizes: [{ rank: 1, amount: 100 }]
  });

  // Automatically calculate total prize pool from prize allocations
  useEffect(() => {
    if (formData.prizes) {
      const total = formData.prizes.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      setFormData((prev) => ({
        ...prev,
        prizePool: total.toString()
      }));
    }
  }, [formData.prizes]);

  const decrementWinnerCount = () => {
    setFormData(prev => {
      const newCount = Math.max(1, Number(prev.winnerCount) - 1);
      const newPrizes = prev.prizes ? prev.prizes.slice(0, newCount) : [{ rank: 1, amount: 100 }];
      while (newPrizes.length < newCount) {
        newPrizes.push({ rank: newPrizes.length + 1, amount: 0 });
      }
      return {
        ...prev,
        winnerCount: newCount.toString(),
        prizes: newPrizes
      };
    });
  };

  const incrementWinnerCount = () => {
    setFormData(prev => {
      const newCount = Number(prev.winnerCount) + 1;
      const newPrizes = prev.prizes ? [...prev.prizes] : [{ rank: 1, amount: 100 }];
      while (newPrizes.length < newCount) {
        newPrizes.push({ rank: newPrizes.length + 1, amount: 0 });
      }
      return {
        ...prev,
        winnerCount: newCount.toString(),
        prizes: newPrizes
      };
    });
  };

  const handlePrizeAmountChange = (index, value) => {
    setFormData(prev => {
      const newPrizes = prev.prizes ? [...prev.prizes] : [];
      if (newPrizes[index]) {
        newPrizes[index] = { ...newPrizes[index], amount: value };
      }
      return {
        ...prev,
        prizes: newPrizes
      };
    });
  };

  const cardsContainerRef = useRef(null);
  const heroRef = useRef(null);
  const hostFormRef = useRef(null);
  const carouselContainerRef = useRef(null);

  // Fetch Tournaments
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await API.get('/tournament');
      setTournaments(res.data);
    } catch (err) {
      console.error('Error fetching tournaments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // Auto-rotate 3D photo carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // GSAP hero animation
  useEffect(() => {
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1, ease: 'power3.out' }
    );
  }, []);

  // GSAP staggered cards reveal
  useEffect(() => {
    if (!loading && tournaments.length > 0 && cardsContainerRef.current) {
      const cards = cardsContainerRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [loading, tournaments, filterMode]);

  // GSAP Form Toggle Animation
  useEffect(() => {
    if (showHostForm && hostFormRef.current) {
      gsap.fromTo(
        hostFormRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [showHostForm]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setHostError('');
  };

  const handleHostClick = () => {
    setHostError('');
    setHostSuccess('');
    
    if (!user) {
      setHostError('Please log in to host matches.');
      return;
    }

    // Role Enforcement check: Only host and admin can access
    if (user.role !== 'host' && user.role !== 'admin') {
      setHostError('Access Denied: Only Hosts or Admins can create tournaments. Update your role to Host in Settings.');
      return;
    }

    if (!user.freeFireId || !user.freeFireName) {
      setHostError('Please configure your Free Fire Game ID and IGN in Profile Settings before hosting.');
      return;
    }

    setShowHostForm(!showHostForm);
  };

  const handleHostSubmit = async (e) => {
    e.preventDefault();
    setHostError('');
    setHostSuccess('');

    // Field validation
    if (!formData.title || !formData.matchDateTime || !formData.slots) {
      setHostError('Please fill in all required fields');
      return;
    }

    setSubmittingHost(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        gameMode: formData.gameMode,
        map: formData.map,
        entryFee: Number(formData.entryFee),
        prizePool: Number(formData.prizePool),
        slots: Number(formData.slots),
        matchDateTime: (() => {
          const [datePart, timePart] = formData.matchDateTime.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hour, minute] = timePart.split(':').map(Number);
          return new Date(year, month - 1, day, hour, minute).toISOString();
        })(),
        maxObservers: Number(formData.maxObservers || 0),
        observerReward: Number(formData.observerReward || 0),
        perKillReward: formData.gameMode === 'BR Ranked' ? Number(formData.perKillReward || 0) : 0,
        prizeDistribution: {
          winnerCount: Number(formData.winnerCount),
          prizes: formData.prizes.map(p => ({
            rank: p.rank,
            amount: Number(p.amount)
          }))
        }
      };

      await API.post('/tournament/create', payload);
      setHostSuccess('Tournament created successfully!');
      setFormData({
        title: '',
        description: '',
        gameMode: 'BR Ranked',
        map: 'Bermuda',
        entryFee: '0',
        prizePool: '100',
        slots: '48',
        matchDateTime: '',
        winnerCount: '1',
        maxObservers: '5',
        observerReward: '0',
        perKillReward: '0',
        prizes: [{ rank: 1, amount: 100 }]
      });
      setTimeout(() => {
        setShowHostForm(false);
        setHostSuccess('');
        fetchTournaments();
      }, 1500);
    } catch (err) {
      setHostError(err.response?.data?.msg || 'Failed to create tournament.');
    } finally {
      setSubmittingHost(false);
    }
  };

  // Observer role management states
  const [showObserverManager, setShowObserverManager] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [managerError, setManagerError] = useState('');

  const handleManageObserversClick = async () => {
    setShowObserverManager(true);
    setManagerError('');
    setFetchingUsers(true);
    try {
      const res = await API.get('/user/all');
      setUsersList(res.data);
    } catch (err) {
      setManagerError(err.response?.data?.msg || 'Failed to fetch users');
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleToggleObserver = async (userId) => {
    try {
      const res = await API.put(`/user/${userId}/toggle-observer`);
      if (res.data.success) {
        setUsersList(prev => prev.map(u => u._id === userId ? { ...u, isObserver: res.data.user.isObserver } : u));
      }
    } catch (err) {
      setManagerError(err.response?.data?.msg || 'Failed to update observer status');
    }
  };

  // Filtered list
  const filteredTournaments = tournaments.filter((t) => {
    if (filterMode === 'All') return true;
    return t.gameMode === filterMode;
  });

  // 3D Card transformation styling
  const getCardStyle = (index) => {
    const diff = (index - slideIndex + slides.length) % slides.length;
    
    if (diff === 0) {
      // Primary card in front
      return {
        transform: 'translateX(0) scale(1) translateZ(0) rotateY(0deg)',
        zIndex: 30,
        opacity: 1,
      };
    } else if (diff === 1) {
      // Offset card to the right/back
      return {
        transform: 'translateX(45px) scale(0.9) translateZ(-80px) rotateY(-12deg)',
        zIndex: 20,
        opacity: 0.75,
      };
    } else {
      // Offset card to the left/back
      return {
        transform: 'translateX(-45px) scale(0.85) translateZ(-160px) rotateY(12deg)',
        zIndex: 10,
        opacity: 0.45,
      };
    }
  };

  return (
    <div className="relative min-h-[90vh] overflow-x-hidden">
      {/* Background sparks particle canvas */}
      <SparkParticles />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8 safe-bottom">
        
        {/* Full-Page Hero Header Area */}
        <div
          ref={heroRef}
          className="relative mb-8 overflow-hidden rounded-3xl border border-gaming-border bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gaming-accent/10 via-gaming-card to-gaming-dark p-6 md:p-12 shadow-card flex flex-col md:flex-row gap-10 items-center min-h-[calc(100vh-120px)] md:py-0 py-8"
        >
          <div className="absolute top-0 right-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-gaming-accent/5 blur-[90px]" />
          
          {/* Left Hero Text block */}
          <div className="flex-1 max-w-xl">
            <div className="mb-4 inline-flex items-center space-x-2 rounded-full border border-gaming-accent/30 bg-gaming-accent/10 px-3 py-1 text-xs font-bold text-gaming-accent">
              <span className="h-2 w-2 rounded-full bg-gaming-accent animate-ping" />
              <span>LIVE COMPETITION ARENA</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl uppercase font-gaming leading-none">
              Rise to the Top in <span className="bg-gradient-fire bg-clip-text text-transparent">Free Fire</span> Lobbies
            </h1>
            
            <p className="mt-4 text-xs leading-relaxed text-gaming-text md:text-sm">
              Participate in custom lobbies. Win matches, accumulate kills, and earn direct wallet deposits. Cashouts are processed straight to your UPI ID!
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              {user && (user.role === 'host' || user.role === 'admin') && (
                <>
                  <button
                    onClick={handleHostClick}
                    className="flex items-center space-x-2 rounded-xl bg-gradient-fire px-5 py-3 text-xs font-extrabold text-white shadow-neon-orange hover:shadow-neon-orange-hover hover:scale-105 transition-all duration-300"
                  >
                    <Plus size={16} />
                    <span>Host Tournament</span>
                  </button>
                  <button
                    onClick={handleManageObserversClick}
                    className="flex items-center space-x-2 rounded-xl border border-gaming-blue bg-gaming-blue/10 px-5 py-3 text-xs font-extrabold text-gaming-blue hover:bg-gaming-blue/20 hover:scale-105 transition-all duration-300"
                  >
                    <Eye size={16} />
                    <span>Manage Observers</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  const element = document.getElementById('match-list');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-xl border border-gaming-border bg-gaming-card/45 px-5 py-3 text-xs font-bold text-white transition hover:bg-gaming-border"
              >
                Browse Lobbies
              </button>
            </div>

            {/* Integrated Stats counters (matching mock template) */}
            <div className="mt-10 flex space-x-8 md:space-x-12 border-t border-gaming-border/40 pt-6">
              <div>
                <p className="text-xl font-black text-white md:text-2xl font-gaming leading-none">50K+</p>
                <p className="mt-1 text-[9px] uppercase font-bold text-gaming-text tracking-wider">Players</p>
              </div>
              <div>
                <p className="text-xl font-black text-white md:text-2xl font-gaming leading-none">1000+</p>
                <p className="mt-1 text-[9px] uppercase font-bold text-gaming-text tracking-wider">Lobbies</p>
              </div>
              <div>
                <p className="text-xl font-black text-white md:text-2xl font-gaming leading-none">₹50K+</p>
                <p className="mt-1 text-[9px] uppercase font-bold text-gaming-text tracking-wider">Winnings Paid</p>
              </div>
            </div>
          </div>

          {/* Right Hero: Scaled 3D Photo Carousel Stack */}
          <div className="relative w-full h-[280px] sm:w-[320px] flex-shrink-0 flex items-center justify-center">
            <div 
              ref={carouselContainerRef} 
              style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
              className="relative w-[300px] h-[400px]"
            >
              {slides.map((src, index) => (
                <div
                  key={index}
                  style={getCardStyle(index)}
                  className="absolute inset-0 rounded-2xl border border-gaming-accent/20 bg-gaming-card overflow-hidden shadow-neon transition-all duration-700 ease-out"
                >
                  <img
                    src={src}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover select-none"
                    draggable="false"
                  />
                  {/* Glowing mask overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infinite Game Modes scrolling ticker strip */}
        <div className="w-full bg-black/80 border-y border-gaming-border/80 py-3.5 overflow-hidden select-none mb-10 rounded-xl">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
            {/* Loop Item Block 1 */}
            <div className="flex items-center gap-10 text-xs font-black uppercase text-gaming-accent tracking-widest">
              <span>Clash Squad</span>
              <span className="text-white opacity-40">•</span>
              <span>Lone Wolf</span>
              <span className="text-white opacity-40">•</span>
              <span>Custom Room</span>
              <span className="text-white opacity-40">•</span>
              <span>BR Ranked</span>
              <span className="text-white opacity-40">•</span>
              <span>Team Deathmatch</span>
              <span className="text-white opacity-40">•</span>
              <span>Battle Royale</span>
              <span className="text-white opacity-40">•</span>
              <span>Speed Clash</span>
            </div>
            <span className="text-white opacity-40">•</span>
            {/* Loop Item Block 2 (Duplicate for infinite seamless wrap) */}
            <div className="flex items-center gap-10 text-xs font-black uppercase text-gaming-accent tracking-widest">
              <span>Clash Squad</span>
              <span className="text-white opacity-40">•</span>
              <span>Lone Wolf</span>
              <span className="text-white opacity-40">•</span>
              <span>Custom Room</span>
              <span className="text-white opacity-40">•</span>
              <span>BR Ranked</span>
              <span className="text-white opacity-40">•</span>
              <span>Team Deathmatch</span>
              <span className="text-white opacity-40">•</span>
              <span>Battle Royale</span>
              <span className="text-white opacity-40">•</span>
              <span>Speed Clash</span>
            </div>
          </div>
        </div>

        {/* Inline Host Form */}
        {showHostForm && (
          <div
            ref={hostFormRef}
            className="glass-panel mb-10 overflow-hidden rounded-2xl border border-gaming-accent/30 p-6 shadow-neon"
          >
            <div className="mb-4 flex items-center justify-between border-b border-gaming-border pb-3">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Gamepad2 className="mr-2 text-gaming-accent" />
                Configure Game Room
              </h2>
              <button
                onClick={() => setShowHostForm(false)}
                className="text-xs font-semibold text-gaming-text hover:text-white"
              >
                Cancel
              </button>
            </div>

            {hostSuccess && (
              <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-3.5 text-sm font-bold text-green-400">
                {hostSuccess}
              </div>
            )}

            <form onSubmit={handleHostSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                  Tournament Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Free Fire Squad Warfare #12"
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent focus:bg-gaming-dark"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                  Game Mode
                </label>
                <select
                  name="gameMode"
                  value={formData.gameMode}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-card py-2.5 px-3 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                >
                  <option value="BR Ranked">BR Ranked</option>
                  <option value="Clash Squad">Clash Squad</option>
                  <option value="Custom Room">Custom Room</option>
                  <option value="Solo Showdown">Solo Showdown</option>
                  <option value="Lone Wolf">Lone Wolf</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                  Map Location
                </label>
                <select
                  name="map"
                  value={formData.map}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-card py-2.5 px-3 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                >
                  <option value="Bermuda">Bermuda</option>
                  <option value="Purgatory">Purgatory</option>
                  <option value="Kalahari">Kalahari</option>
                  <option value="Alpine">Alpine</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                  <Coins size={13} className="mr-1 text-gaming-accent" />
                  Entry Fee (₹)
                </label>
                <input
                  type="number"
                  name="entryFee"
                  min="0"
                  value={formData.entryFee}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text">
                  Winner Slots to Reward
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={decrementWinnerCount}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gaming-border bg-gaming-card text-lg font-bold text-white hover:border-gaming-accent hover:text-gaming-accent transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={`${formData.winnerCount} Player${Number(formData.winnerCount) > 1 ? 's' : ''}`}
                    className="h-10 w-full rounded-xl border border-gaming-border bg-gaming-dark/60 text-center text-sm font-semibold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={incrementWinnerCount}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gaming-border bg-gaming-card text-lg font-bold text-white hover:border-gaming-accent hover:text-gaming-accent transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {formData.prizes && formData.prizes.map((prize, idx) => (
                <div key={prize.rank}>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                    <Award size={13} className={`mr-1 ${idx === 0 ? 'text-gaming-accent' : idx === 1 ? 'text-gaming-blue' : idx === 2 ? 'text-gaming-yellow' : 'text-gaming-text'}`} />
                    Rank #{prize.rank} Prize (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prize.amount}
                    onChange={(e) => handlePrizeAmountChange(idx, e.target.value)}
                    className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                    required
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                  <Users size={13} className="mr-1 text-gaming-accent" />
                  Max Observers
                </label>
                <input
                  type="number"
                  name="maxObservers"
                  min="0"
                  max="10"
                  value={formData.maxObservers}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                  <Coins size={13} className="mr-1 text-gaming-accent" />
                  Observer Reward (₹)
                </label>
                <input
                  type="number"
                  name="observerReward"
                  min="0"
                  value={formData.observerReward}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                  required
                />
              </div>

              {formData.gameMode === 'BR Ranked' && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                    <Coins size={13} className="mr-1 text-gaming-accent" />
                    Per Kill Reward (₹)
                  </label>
                  <input
                    type="number"
                    name="perKillReward"
                    min="0"
                    value={formData.perKillReward}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                  <Coins size={13} className="mr-1 text-gaming-accent" />
                  Total Prize Pool (₹)
                </label>
                <input
                  type="number"
                  name="prizePool"
                  value={formData.prizePool}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/40 py-2.5 px-3.5 text-sm font-medium text-gaming-text outline-none cursor-not-allowed"
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                  <Users size={13} className="mr-1 text-gaming-yellow" />
                  Max Slots
                </label>
                <input
                  type="number"
                  name="slots"
                  min="2"
                  max="100"
                  value={formData.slots}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                  <Calendar size={13} className="mr-1 text-gaming-accent" />
                  Match Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="matchDateTime"
                  value={formData.matchDateTime}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submittingHost}
                  className="w-full rounded-xl bg-gradient-fire py-3 text-sm font-extrabold text-white shadow-neon-orange hover:shadow-neon-orange-hover hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                >
                  {submittingHost ? 'Publishing...' : 'Deploy Tournament'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Global Host error notification */}
        {hostError && (
          <div className="mb-8 flex items-center space-x-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400">
            <ShieldAlert size={18} className="flex-shrink-0" />
            <span>{hostError}</span>
          </div>
        )}

        {/* Main Tournament List Title and Filters */}
        <div id="match-list" className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wide flex items-center font-gaming">
              <Gamepad2 size={24} className="mr-2 text-gaming-accent" />
              Lobby Directory
            </h2>
            <p className="text-xs text-gaming-text">Select a room mode to view and participate</p>
          </div>

          <button
            onClick={fetchTournaments}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gaming-border bg-gaming-card/40 text-gaming-text hover:bg-gaming-border hover:text-white"
            title="Refresh match list"
          >
            <RefreshCw size={16} className={`${loading ? 'animate-spin text-gaming-accent' : ''}`} />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="mb-8 flex flex-wrap gap-2.5">
          {['All', 'BR Ranked', 'Clash Squad', 'Custom Room', 'Solo Showdown', 'Lone Wolf'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase transition-all duration-350 ${
                filterMode === mode
                  ? 'bg-gradient-neon text-black font-extrabold shadow-neon hover:scale-105'
                  : 'border border-gaming-border bg-gaming-card/45 text-gaming-text hover:bg-gaming-border hover:text-white hover:scale-105'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Tournament Cards Grid */}
        {loading ? (
          <div className="flex h-40 flex-col items-center justify-center">
            <span className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gaming-accent border-t-transparent" />
            <p className="text-xs font-bold text-gaming-text">Fetching matches from central servers...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center rounded-2xl border border-gaming-border p-12 text-center">
            <Gamepad2 size={48} className="mb-4 text-gaming-text opacity-40" />
            <h3 className="text-lg font-bold text-white">No active matches found</h3>
            <p className="mt-1 max-w-sm text-xs text-gaming-text">
              {user && (user.role === 'host' || user.role === 'admin')
                ? 'There are no tournaments currently listed in this category. Click "Host Tournament" to set up your own lobby.'
                : 'There are no tournaments currently listed in this category. Please check back later.'}
            </p>
          </div>
        ) : (
          <div
            ref={cardsContainerRef}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament._id} tournament={tournament} />
            ))}
          </div>
        )}
        {/* Observer Manager Modal */}
        {showObserverManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-gaming-border bg-gaming-dark/95 p-6 shadow-neon">
              <div className="mb-4 flex items-center justify-between border-b border-gaming-border pb-3">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Eye className="mr-2 text-gaming-blue" size={16} />
                  Observer Role Management
                </h3>
                <button
                  onClick={() => setShowObserverManager(false)}
                  className="text-xs font-semibold text-gaming-text hover:text-white"
                >
                  Close
                </button>
              </div>

              {managerError && (
                <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
                  {managerError}
                </div>
              )}

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users by username or IGN..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2 px-3 text-xs text-white outline-none focus:border-gaming-blue"
                />
              </div>

              {fetchingUsers ? (
                <div className="py-10 text-center text-xs font-bold text-gaming-text">
                  Fetching registered users...
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                  {usersList
                    .filter(u => 
                      u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                      (u.freeFireName && u.freeFireName.toLowerCase().includes(userSearch.toLowerCase())) ||
                      (u.freeFireId && u.freeFireId.toLowerCase().includes(userSearch.toLowerCase())) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u._id.toString().toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map(u => (
                      <div key={u._id} className="flex items-center justify-between rounded-xl bg-gaming-card p-3 border border-gaming-border/40">
                        <div>
                          <p className="text-xs font-bold text-white">@{u.username}</p>
                          <p className="text-[9px] text-gaming-text">
                            {u.email} {u.freeFireName ? `| IGN: ${u.freeFireName}` : ''} {u.freeFireId ? `| Player ID: ${u.freeFireId}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleObserver(u._id)}
                          className={`rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold uppercase transition-all duration-200 ${
                            u.isObserver
                              ? 'bg-gaming-blue text-black hover:bg-gaming-blue/80'
                              : 'border border-gaming-border text-gaming-text hover:border-gaming-blue hover:text-gaming-blue'
                          }`}
                        >
                          {u.isObserver ? 'Assigned' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  {usersList.length === 0 && (
                    <div className="text-center text-xs text-gaming-text py-6">
                      No registered users found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
