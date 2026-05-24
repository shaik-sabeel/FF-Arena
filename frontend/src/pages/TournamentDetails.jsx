import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Award, Calendar, Users, MapPin, Swords, ShieldCheck, Plus, ListPlus, Send, XCircle, CheckCircle, HelpCircle } from 'lucide-react';
import gsap from 'gsap';

const TournamentDetails = () => {
  const { id } = useParams();
  const { user, syncWalletBalance, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Registration and actions states
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState('');

  // Host room creation console states
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomPasswordInput, setRoomPasswordInput] = useState('');
  const [updatingRoom, setUpdatingRoom] = useState(false);

  // Host declare results desk states
  const [winnerIdInput, setWinnerIdInput] = useState('');
  const [recordingResults, setRecordingResults] = useState([]);
  const [submittingResults, setSubmittingResults] = useState(false);

  const containerRef = useRef(null);
  const hostConsoleRef = useRef(null);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/tournament/${id}`);
      setTournament(res.data);
      
      // Initialize results recorder list with joined players
      if (res.data.playersJoined) {
        const initialResults = res.data.playersJoined.map((player) => ({
          user: player._id,
          username: player.username,
          freeFireName: player.freeFireName,
          rank: '2',
          kills: '0',
          prizeWon: '0'
        }));
        setRecordingResults(initialResults);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  // GSAP animation
  useEffect(() => {
    if (tournament) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, [tournament]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user.freeFireId || !user.freeFireName) {
      setError('Required: Go to settings and configure your Free Fire Game ID & IGN first.');
      return;
    }

    if (user.walletBalance < tournament.entryFee) {
      setError('Insufficient wallet balance. Please add cash in wallet tab.');
      return;
    }

    setJoining(true);
    setError('');
    try {
      const res = await API.post(`/tournament/${id}/join`);
      setTournament(res.data.tournament);
      syncWalletBalance(res.data.walletBalance);
      setJoinSuccess('Successfully joined this match lobby!');
      
      // Clear success alert after time
      setTimeout(() => setJoinSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const handleRoomPublish = async (e) => {
    e.preventDefault();
    if (!roomIdInput || !roomPasswordInput) {
      setError('Required: Room ID and password');
      return;
    }

    setUpdatingRoom(true);
    setError('');
    try {
      const res = await API.put(`/tournament/${id}/room`, {
        roomId: roomIdInput,
        roomPassword: roomPasswordInput
      });
      setTournament(res.data);
      setRoomIdInput('');
      setRoomPasswordInput('');
      // Trigger user sync
      refreshUser();
      fetchTournamentDetails();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to publish custom room');
    } finally {
      setUpdatingRoom(false);
    }
  };

  const handleResultChange = (index, field, value) => {
    const updated = [...recordingResults];
    updated[index][field] = value;
    setRecordingResults(updated);
  };

  const handleCompleteMatch = async (e) => {
    e.preventDefault();
    setSubmittingResults(true);
    setError('');
    
    try {
      const formattedResults = recordingResults.map((r) => ({
        user: r.user,
        rank: Number(r.rank),
        kills: Number(r.kills),
        prizeWon: Number(r.prizeWon)
      }));

      const res = await API.put(`/tournament/${id}/complete`, {
        winnerId: winnerIdInput || undefined,
        results: formattedResults
      });

      setTournament(res.data);
      // Trigger auth wallet sync
      refreshUser();
      fetchTournamentDetails();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to finalize match results');
    } finally {
      setSubmittingResults(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-80 flex-col items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-gaming-accent border-t-transparent" />
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-semibold text-red-400">
          {error}
        </div>
        <Link to="/" className="mt-4 inline-block text-xs font-bold text-gaming-accent hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  const hasJoined = tournament.playersJoined?.some((p) => p._id === user?.id || p === user?.id);
  const slotsLeft = tournament.slots - (tournament.playersJoined?.length || 0);
  const isHost = tournament.host?._id === user?.id || tournament.host === user?.id;

  return (
    <div ref={containerRef} className="mx-auto max-w-5xl px-4 py-8 safe-bottom">
      
      {/* Back button */}
      <Link to="/" className="mb-4 inline-flex items-center text-xs font-bold text-gaming-text hover:text-white">
        &larr; Back to Dashboard
      </Link>

      {/* Grid containing details and registers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel relative overflow-hidden rounded-2xl border border-gaming-border p-6">
            
            {/* Tag bar */}
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-md border border-gaming-accent/20 bg-gaming-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gaming-accent">
                {tournament.gameMode}
              </span>
              <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                tournament.status === 'upcoming' 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                  : tournament.status === 'ongoing' 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                    : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
                {tournament.status}
              </span>
            </div>

            <h1 className="text-2xl font-black text-white uppercase md:text-3xl">{tournament.title}</h1>
            <p className="mt-3 text-xs text-gaming-text leading-relaxed">
              {tournament.description || 'Welcome to this competitive Free Fire lobby. Be sure to check match times and enter details accurately.'}
            </p>

            {/* Sub details icons */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-b border-gaming-border py-4">
              <div className="flex items-center space-x-2.5">
                <MapPin className="text-gaming-accent" size={18} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-gaming-text">Map</p>
                  <p className="text-xs font-extrabold text-white">{tournament.map}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Users className="text-gaming-blue" size={18} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-gaming-text">Slots Left</p>
                  <p className="text-xs font-extrabold text-white">{slotsLeft} Slots</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Calendar className="text-gaming-yellow" size={18} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-gaming-text">Match Schedule</p>
                  <p className="text-xs font-extrabold text-white">
                    {new Date(tournament.matchDateTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Host Tag info */}
            <div className="mt-4 flex items-center justify-between text-xs text-gaming-text">
              <span>Hosted by: <strong className="text-white">@{tournament.host?.username || 'Host'}</strong></span>
              {tournament.host?.freeFireName && (
                <span>Host IGN: <strong className="text-white">{tournament.host.freeFireName}</strong></span>
              )}
            </div>

          </div>

          {/* Registered Players Roster */}
          <div className="glass-panel rounded-2xl border border-gaming-border p-5">
            <h3 className="mb-4 flex items-center text-sm font-bold uppercase tracking-wider text-white">
              <Users size={16} className="mr-2 text-gaming-blue" />
              Lobby Roster ({tournament.playersJoined?.length || 0} Registered)
            </h3>
            
            {tournament.playersJoined?.length === 0 ? (
              <p className="py-4 text-center text-xs font-semibold text-gaming-text">
                Lobby is currently empty. Be the first to join!
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tournament.playersJoined.map((player, idx) => (
                  <div
                    key={player._id}
                    className="flex items-center justify-between rounded-xl bg-gaming-dark/60 border border-gaming-border/60 p-3"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-[10px] font-bold text-gaming-text">#{idx + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[120px]">{player.freeFireName || player.username}</p>
                        <p className="text-[9px] text-gaming-text">@{player.username}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase text-gaming-accent flex items-center">
                        <Award size={10} className="mr-0.5" /> ₹{player.stats?.earnings || 0}
                      </p>
                      <p className="text-[9px] text-gaming-text font-bold uppercase flex items-center">
                        <Swords size={9} className="mr-0.5" /> {player.stats?.kills || 0} Kills
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel sidebar */}
        <div className="space-y-6">
          
          {/* Join / Status Card */}
          <div className="glass-panel rounded-2xl border border-gaming-border p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gaming-text">Lobby Registry</h3>
            
            <div className="mb-4 flex items-center justify-between rounded-xl bg-gaming-dark/60 p-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gaming-text">Entry Fee</p>
                <p className="text-lg font-black text-white">
                  {tournament.entryFee === 0 ? <span className="text-green-400 font-extrabold">FREE</span> : `₹${tournament.entryFee}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-gaming-text">Grand Prize</p>
                <p className="text-lg font-black text-gaming-yellow">₹{tournament.prizePool}</p>
              </div>
            </div>

            {/* Error alerts inside card */}
            {error && (
              <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-[10px] font-bold text-red-400">
                {error}
              </div>
            )}

            {joinSuccess && (
              <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-[10px] font-bold text-green-400 flex items-center">
                <CheckCircle size={12} className="mr-1" />
                {joinSuccess}
              </div>
            )}

            {/* Join trigger states logic */}
            {tournament.status === 'completed' ? (
              <div className="text-center">
                <div className="mb-3 rounded-xl bg-gaming-accent/10 border border-gaming-accent/20 p-3 text-xs font-bold text-gaming-accent">
                  Match Completed
                </div>
                {tournament.winner && (
                  <p className="text-xs font-semibold text-gaming-text">
                    Champion Winner: <strong className="text-gaming-yellow">@{tournament.winner.username}</strong>
                  </p>
                )}
              </div>
            ) : hasJoined ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 rounded-xl bg-green-500/15 border border-green-500/30 p-3 text-xs font-extrabold text-green-400">
                  <ShieldCheck size={16} />
                  <span>REGISTERED PLAYER</span>
                </div>
                
                {/* Display room details if ongoing/started */}
                {tournament.status === 'ongoing' && tournament.roomDetails?.roomId ? (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                    <p className="text-[9px] uppercase tracking-wider text-green-400 font-extrabold flex items-center">
                      <Swords size={12} className="mr-1 animate-pulse" /> Match is live! Connect now
                    </p>
                    <p className="text-xs font-medium text-gaming-text">
                      Custom Room ID:{' '}
                      <span className="font-mono text-white font-black text-sm select-all">
                        {tournament.roomDetails.roomId}
                      </span>
                    </p>
                    <p className="text-xs font-medium text-gaming-text">
                      Room Password:{' '}
                      <span className="font-mono text-white font-black text-sm select-all">
                        {tournament.roomDetails.roomPassword}
                      </span>
                    </p>
                    <p className="text-[9px] leading-relaxed text-gaming-text italic mt-1 border-t border-gaming-border pt-1">
                      Enter credentials in your Free Fire game client under Custom Mode.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gaming-dark/60 p-3 text-center text-[10px] font-semibold text-gaming-text">
                    Lobby credentials will appear here once the host publishes the room details (usually 15-30 minutes before match schedule).
                  </div>
                )}
              </div>
            ) : slotsLeft <= 0 ? (
              <button disabled className="w-full rounded-xl bg-gaming-border py-3 text-xs font-bold text-gaming-text cursor-not-allowed">
                LOBBY SLOTS FULL
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full rounded-xl bg-gaming-accent py-3.5 text-sm font-extrabold text-white shadow-neon hover:shadow-neon-hover transition disabled:opacity-50"
              >
                {joining ? 'Registering...' : 'REGISTER FOR MATCH'}
              </button>
            )}
          </div>

          {/* Host Administration Console */}
          {isHost && (
            <div
              ref={hostConsoleRef}
              className="glass-panel border-t-2 border-t-gaming-accent rounded-2xl border border-gaming-border p-5 space-y-6 shadow-neon"
            >
              <h3 className="text-xs font-black uppercase tracking-wider text-gaming-accent border-b border-gaming-border pb-2 flex items-center">
                <Send size={13} className="mr-1.5" />
                HOST CONTROL PANEL
              </h3>

              {/* Set up Custom Match Room Details */}
              {tournament.status === 'upcoming' && (
                <form onSubmit={handleRoomPublish} className="space-y-3.5">
                  <p className="text-[10px] text-gaming-text font-semibold">Publish Free Fire Custom Room credentials to all registered players:</p>
                  
                  <div>
                    <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-gaming-text">Room ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 54321098"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value)}
                      className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2 px-3 text-xs font-semibold text-white outline-none focus:border-gaming-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-gaming-text">Room Password</label>
                    <input
                      type="text"
                      placeholder="e.g. play678"
                      value={roomPasswordInput}
                      onChange={(e) => setRoomPasswordInput(e.target.value)}
                      className="w-full rounded-xl border border-gaming-border bg-gaming-dark/60 py-2 px-3 text-xs font-semibold text-white outline-none focus:border-gaming-accent"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingRoom}
                    className="w-full rounded-xl bg-gaming-accent py-2 text-xs font-extrabold text-white transition hover:shadow-neon"
                  >
                    {updatingRoom ? 'Deploying Room...' : 'Start Match & Send Room ID'}
                  </button>
                </form>
              )}

              {/* Declare Results Panel */}
              {tournament.status === 'ongoing' && (
                <form onSubmit={handleCompleteMatch} className="space-y-4">
                  <p className="text-[10px] text-gaming-text font-bold uppercase border-b border-gaming-border pb-1 text-gaming-blue">Record Match Rankings</p>
                  
                  <div>
                    <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-gaming-text">Select Winner Champion</label>
                    <select
                      value={winnerIdInput}
                      onChange={(e) => setWinnerIdInput(e.target.value)}
                      className="w-full rounded-xl border border-gaming-border bg-gaming-card py-2 px-2.5 text-xs font-bold text-white outline-none"
                      required
                    >
                      <option value="">Choose winner...</option>
                      {tournament.playersJoined.map((player) => (
                        <option key={player._id} value={player._id}>
                          {player.freeFireName || player.username} (@{player.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {recordingResults.map((result, idx) => (
                      <div key={result.user} className="rounded-xl border border-gaming-border/40 bg-gaming-dark/30 p-2.5 text-[10px] space-y-2">
                        <p className="font-extrabold text-white">{result.freeFireName || result.username} (@{result.username})</p>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[8px] text-gaming-text font-bold uppercase">Rank</label>
                            <input
                              type="number"
                              min="1"
                              value={result.rank}
                              onChange={(e) => handleResultChange(idx, 'rank', e.target.value)}
                              className="w-full rounded bg-gaming-card border border-gaming-border py-1 px-1.5 text-white font-mono text-center"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] text-gaming-text font-bold uppercase">Kills</label>
                            <input
                              type="number"
                              min="0"
                              value={result.kills}
                              onChange={(e) => handleResultChange(idx, 'kills', e.target.value)}
                              className="w-full rounded bg-gaming-card border border-gaming-border py-1 px-1.5 text-white font-mono text-center"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] text-gaming-text font-bold uppercase">Award (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={result.prizeWon}
                              onChange={(e) => handleResultChange(idx, 'prizeWon', e.target.value)}
                              className="w-full rounded bg-gaming-card border border-gaming-border py-1 px-1.5 text-white font-mono text-center"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingResults}
                    className="w-full rounded-xl bg-gradient-fire py-2.5 text-xs font-black text-white transition hover:shadow-neon"
                  >
                    {submittingResults ? 'Distributing funds...' : 'Finalize & Distribute Prizes'}
                  </button>
                </form>
              )}

              {/* Already Completed */}
              {tournament.status === 'completed' && (
                <div className="rounded-xl bg-gaming-dark/60 p-3.5 text-center text-xs font-bold text-gaming-text">
                  Match completed. Prizes have been credited to player wallets.
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default TournamentDetails;
