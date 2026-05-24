import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import TournamentCard from '../components/TournamentCard';
import SparkParticles from '../components/SparkParticles';
import { Gamepad2, Plus, Calendar, Coins, ShieldAlert, Users, Award, Map, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('All');
  
  // Carousel states
  const [carouselIndex, setCarouselIndex] = useState(0);
  
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
    matchDateTime: ''
  });

  const cardsContainerRef = useRef(null);
  const heroRef = useRef(null);
  const hostFormRef = useRef(null);
  const carouselRef = useRef(null);

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

  // GSAP Carousel Slide Transition
  useEffect(() => {
    if (carouselRef.current) {
      gsap.fromTo(
        carouselRef.current,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [carouselIndex]);

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
      setHostError('Access Denied: Only Hosts or Admins can create tournaments. Go to Settings to update your profile.');
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
      await API.post('/tournament/create', formData);
      setHostSuccess('Tournament created successfully!');
      setFormData({
        title: '',
        description: '',
        gameMode: 'BR Ranked',
        map: 'Bermuda',
        entryFee: '0',
        prizePool: '100',
        slots: '48',
        matchDateTime: ''
      });
      // Close form and refresh
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

  // Filtered list
  const filteredTournaments = tournaments.filter((t) => {
    if (filterMode === 'All') return true;
    return t.gameMode === filterMode;
  });

  // Featured Tournaments Carousel (take top 3 sorted by prizePool)
  const featuredMatches = [...tournaments]
    .sort((a, b) => b.prizePool - a.prizePool)
    .slice(0, 3);

  // Fallback featured data if database is fresh
  const fallbackFeatured = [
    { title: 'Bermuda Fire Cup League', gameMode: 'BR Ranked', prizePool: 1500, entryFee: 100, map: 'Bermuda' },
    { title: 'Clash Squad Pro League', gameMode: 'Clash Squad', prizePool: 800, entryFee: 50, map: 'Purgatory' },
    { title: 'Kalahari Solo Snipe Lobbies', gameMode: 'Solo Showdown', prizePool: 300, entryFee: 0, map: 'Kalahari' }
  ];

  const currentFeatured = featuredMatches.length > 0 ? featuredMatches : fallbackFeatured;

  const handleNextFeatured = () => {
    setCarouselIndex((prev) => (prev + 1) % currentFeatured.length);
  };

  const handlePrevFeatured = () => {
    setCarouselIndex((prev) => (prev - 1 + currentFeatured.length) % currentFeatured.length);
  };

  return (
    <div className="relative min-h-[90vh] overflow-x-hidden">
      {/* Canvas sparks background */}
      <SparkParticles />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8 safe-bottom">
        
        {/* Hero Header Area + Carousel */}
        <div
          ref={heroRef}
          className="relative mb-10 overflow-hidden rounded-3xl border border-gaming-border bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gaming-accent/15 via-gaming-card to-gaming-dark p-6 md:p-10 shadow-card flex flex-col md:flex-row gap-8 items-center"
        >
          <div className="absolute top-0 right-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-gaming-accent/10 blur-[80px]" />
          
          {/* Hero left text block */}
          <div className="flex-1 max-w-xl">
            <div className="mb-4 inline-flex items-center space-x-2 rounded-full border border-gaming-accent/30 bg-gaming-accent/15 px-3 py-1 text-xs font-bold text-gaming-accent">
              <span className="h-2 w-2 rounded-full bg-gaming-accent animate-ping" />
              <span>LIVE COMPETITION ARENA</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl uppercase font-gaming leading-none">
              Rise to the Top in <span className="bg-gradient-fire bg-clip-text text-transparent">Free Fire</span> Lobbies
            </h1>
            
            <p className="mt-4 text-xs leading-relaxed text-gaming-text md:text-sm">
              Participate in custom tournaments. Win matches, accumulate kills, and earn direct wallet deposits. Seamless cashouts are processed straight to your UPI address!
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={handleHostClick}
                className="flex items-center space-x-2 rounded-xl bg-gaming-accent px-5 py-3.5 text-xs font-extrabold text-white shadow-neon transition hover:bg-opacity-95 hover:shadow-neon-hover"
              >
                <Plus size={16} />
                <span>Host Tournament</span>
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('match-list');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-xl border border-gaming-border bg-gaming-card/40 px-5 py-3.5 text-xs font-bold text-white transition hover:bg-gaming-border"
              >
                Browse Lobbies
              </button>
            </div>
          </div>

          {/* Hero Right Featured Carousel block */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="glass-panel relative rounded-2xl border border-gaming-accent/25 p-5 shadow-neon">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gaming-accent">Featured Match</span>
                
                {/* Carousel Controls */}
                <div className="flex space-x-1.5">
                  <button
                    onClick={handlePrevFeatured}
                    className="flex h-5 w-5 items-center justify-center rounded bg-gaming-dark text-gaming-text hover:text-white transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={handleNextFeatured}
                    className="flex h-5 w-5 items-center justify-center rounded bg-gaming-dark text-gaming-text hover:text-white transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Slider Card element */}
              <div ref={carouselRef} className="space-y-4">
                <h3 className="text-sm font-extrabold text-white line-clamp-1">
                  {currentFeatured[carouselIndex].title}
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-left rounded-lg bg-gaming-dark/60 p-2.5">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-gaming-text">Prize Pool</span>
                    <p className="text-xs font-black text-gaming-yellow">₹{currentFeatured[carouselIndex].prizePool}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-gaming-text">Entry Fee</span>
                    <p className="text-xs font-black text-white">
                      {currentFeatured[carouselIndex].entryFee === 0 ? 'FREE' : `₹${currentFeatured[carouselIndex].entryFee}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gaming-text">
                  <span className="bg-gaming-accent/15 px-2 py-0.5 rounded border border-gaming-accent/20 font-bold uppercase">
                    {currentFeatured[carouselIndex].gameMode}
                  </span>
                  <span>Map: <strong>{currentFeatured[carouselIndex].map}</strong></span>
                </div>
              </div>

              {/* Carousel Index indicators */}
              <div className="mt-4 flex justify-center space-x-1.5">
                {currentFeatured.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      carouselIndex === i ? 'w-4 bg-gaming-accent' : 'w-1.5 bg-gaming-border'
                    }`}
                  />
                ))}
              </div>
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
                  <Coins size={13} className="mr-1 text-gaming-yellow" />
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
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                  <Award size={13} className="mr-1 text-gaming-yellow" />
                  Prize Pool (₹)
                </label>
                <input
                  type="number"
                  name="prizePool"
                  min="10"
                  value={formData.prizePool}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2.5 px-3.5 text-sm font-medium text-white outline-none focus:border-gaming-accent"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gaming-text flex items-center">
                  <Users size={13} className="mr-1 text-gaming-blue" />
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
                  className="w-full rounded-xl bg-gradient-fire py-3 text-sm font-extrabold text-white shadow-neon hover:shadow-neon-hover transition disabled:opacity-50"
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
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wide flex items-center">
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
          {['All', 'BR Ranked', 'Clash Squad', 'Custom Room', 'Solo Showdown'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase transition duration-200 ${
                filterMode === mode
                  ? 'bg-gaming-accent text-white shadow-neon'
                  : 'border border-gaming-border bg-gaming-card/40 text-gaming-text hover:bg-gaming-border hover:text-white'
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
              There are no tournaments currently listed in this category. Click "Host Tournament" to set up your own lobby.
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
      </div>
    </div>
  );
};

export default Home;
