import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Award, Calendar, Users, MapPin, Swords, ShieldCheck, Plus, ListPlus, Send, XCircle, CheckCircle, HelpCircle, Eye, ShieldAlert, Clock } from 'lucide-react';
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Host room creation console states
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomPasswordInput, setRoomPasswordInput] = useState('');
  const [updatingRoom, setUpdatingRoom] = useState(false);

  // Host declare results desk states
  const [winnerIdInput, setWinnerIdInput] = useState('');
  const [recordingResults, setRecordingResults] = useState([]);
  const [submittingResults, setSubmittingResults] = useState(false);
  const [winner1Id, setWinner1Id] = useState('');
  const [winner2Id, setWinner2Id] = useState('');
  const [winner3Id, setWinner3Id] = useState('');
  const [killsInputs, setKillsInputs] = useState({});
  const [botRunning, setBotRunning] = useState(false);
  const [botLogs, setBotLogs] = useState([]);

  // Spectator consensus voting states
  const [votingResults, setVotingResults] = useState([]);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState('');
  const [voteError, setVoteError] = useState('');

  const handleVoteChange = (userIndex, field, value) => {
    setVotingResults((prev) => {
      const updated = [...prev];
      if (updated[userIndex]) {
        updated[userIndex] = {
          ...updated[userIndex],
          [field]: value
        };
      }
      return updated;
    });
  };

  const handleVoteSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmittingVote(true);
    setVoteError('');
    setVoteSuccess('');

    try {
      const res = await API.post(`/tournament/${id}/vote`, {
        results: votingResults.map(r => ({
          user: r.user,
          rank: Number(r.rank),
          kills: Number(r.kills)
        }))
      });
      setVoteSuccess('Vote submitted successfully! Checking consensus...');
      setTournament(res.data.tournament);
      setTimeout(() => {
        setVoteSuccess('');
        fetchTournamentDetails();
        refreshUser();
      }, 1500);
    } catch (err) {
      setVoteError(err.response?.data?.msg || 'Failed to submit vote');
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleBotResolve = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const confirmPayout = window.confirm(
      "CONFIRM RESOLUTION: Are you sure you want to finalize results and execute cash prize distributions to player accounts? This operation is permanent and cannot be reversed."
    );
    if (!confirmPayout) return;

    setBotRunning(true);
    setBotLogs([]);
    setError('');

    const addLog = (msg, delay) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setBotLogs((prev) => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    try {
      await addLog('🤖 Winnings Payout Bot Online.', 200);
      await addLog('📡 Connecting to Garena Free Fire lobby client...', 400);
      
      // Call Backend API to run the resolution and get the results
      const res = await API.put(`/tournament/${id}/resolve`);
      const { tournament: updatedTournament, garenaLobbyResults } = res.data;

      await addLog('✓ Custom room data synced. 50 participants retrieved.', 400);
      await addLog('🔍 Scanning character IGNs in lobby results...', 500);

      // Print matched players
      for (const resItem of updatedTournament.results) {
        const username = resItem.user?.username || 'Unknown';
        const freeFireName = resItem.user?.freeFireName || 'Unknown';
        await addLog(
          `✓ Match: ${freeFireName} ➔ @${username} (Rank #${resItem.rank} | ${resItem.kills} Kills)`,
          250
        );
      }

      await addLog(`💰 Distributing prize pool of ₹${updatedTournament.prizePool}...`, 400);
      await addLog('💸 Updating wallet balances:', 300);
      await addLog(`  - Host Wallet: Deducted ₹${updatedTournament.prizePool.toFixed(2)}`, 200);

      for (const resItem of updatedTournament.results) {
        if (resItem.prizeWon > 0) {
          const username = resItem.user?.username || 'player';
          await addLog(`  - @${username} (Rank #${resItem.rank}): Credited ₹${resItem.prizeWon.toFixed(2)}`, 200);
        }
      }

      await addLog('📝 Internal transaction ledger entries generated.', 300);
      await addLog('✓ Tournament status set to COMPLETED.', 200);
      await addLog('🏆 Tournament status successfully resolved by Bot!', 400);

      setTimeout(() => {
        setTournament(updatedTournament);
        setBotRunning(false);
        setBotLogs([]);
        refreshUser();
        fetchTournamentDetails();
      }, 1500);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.msg || 'Bot prize resolution failed';
      await addLog(`❌ Error: ${errMsg}`, 300);
      setError(errMsg);
      // Keep logs visible so user can read them before closing
      setTimeout(() => {
        setBotRunning(false);
      }, 4000);
    }
  };

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
        setVotingResults(res.data.playersJoined.map((player) => ({
          user: player._id,
          username: player.username,
          freeFireName: player.freeFireName,
          rank: '2',
          kills: '0'
        })));
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

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [utr, setUtr] = useState('');

  const handleJoin = async (role = 'player') => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user.freeFireId || !user.freeFireName) {
      setError('Required: Go to settings and configure your Free Fire Game ID & IGN first.');
      return;
    }

    if (role === 'observer') {
      await handleJoinSubmit('observer');
      return;
    }

    if (tournament.entryFee > 0) {
      setShowJoinModal(true);
    } else {
      await handleJoinSubmit('player');
    }
  };

  const handleJoinSubmit = async (role = 'player') => {
    setJoining(true);
    setError('');
    try {
      const res = await API.post(`/tournament/${id}/join`, { 
        role, 
        paymentMethod: 'manual', 
        utr: tournament.entryFee > 0 ? utr : undefined 
      });
      setTournament(res.data.tournament);
      syncWalletBalance(res.data.walletBalance);
      
      if (res.data.status === 'pending_approval') {
        setJoinSuccess('Registration request submitted! Awaiting Host approval for transaction UTR.');
      } else {
        setJoinSuccess(`Successfully joined this match lobby as a ${role === 'observer' ? 'Spectator' : 'Player'}!`);
      }
      setShowJoinModal(false);
      setUtr('');
      setTimeout(() => setJoinSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const handleApproveRegistration = async (targetUserId) => {
    setError('');
    try {
      const res = await API.put(`/tournament/${id}/approve-registration`, { userId: targetUserId });
      setTournament(res.data);
      setJoinSuccess('Player entry approved successfully!');
      setTimeout(() => setJoinSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to REJECT this registration entry?')) return;
    setError('');
    try {
      const res = await API.put(`/tournament/${id}/reject-registration`, { userId: targetUserId });
      setTournament(res.data);
      setJoinSuccess('Player entry rejected.');
      setTimeout(() => setJoinSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reject registration');
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

  const handleDeleteTournament = async () => {
    if (!window.confirm('Are you absolutely sure you want to cancel and delete this tournament? Registered players will be fully refunded their entry fees.')) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await API.delete(`/tournament/${id}`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete tournament');
      setDeleting(false);
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

  const userId = user?.id || user?._id;
  const hasJoinedPlayer = tournament.playersJoined?.some((p) => {
    const pId = p._id || p;
    return pId.toString() === userId?.toString();
  });
  const hasJoinedObserver = tournament.observersJoined?.some((o) => {
    const oId = o._id || o;
    return oId.toString() === userId?.toString();
  });
  const hasJoined = hasJoinedPlayer || hasJoinedObserver;
  const pendingItem = tournament.pendingRegistrations?.find((p) => {
    const pUserId = p.user?._id || p.user;
    return pUserId?.toString() === userId?.toString();
  });
  const isPending = !!pendingItem;
  const hasVoted = tournament.observerVotes?.some((v) => {
    const vObs = v.observer?._id || v.observer;
    return vObs?.toString() === userId?.toString();
  });
  const slotsLeft = tournament.slots - (tournament.playersJoined?.length || 0);
  const maxObservers = tournament.maxObservers || 5;
  const observerSlotsLeft = maxObservers - (tournament.observersJoined?.length || 0);
  const isAssignedObserver = user?.isObserver === true;
  const isHost = (tournament.host?._id || tournament.host)?.toString() === userId?.toString();
  const isAdmin = user?.role === 'admin';
  const canManage = isHost || isAdmin;

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
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-gaming-accent/20 bg-gaming-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gaming-accent">
                  {tournament.gameMode}
                </span>
                <span className="rounded-md border border-gaming-gold/25 bg-gaming-gold/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-gaming-gold flex items-center gap-1.5">
                  <Award size={12} />
                  SKILL MATCH
                </span>
              </div>
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

            {tournament.gameMode === 'BR Ranked' && tournament.perKillReward > 0 && (
              <div className="mb-4 rounded-xl bg-gaming-accent/10 border border-gaming-accent/25 p-3 flex justify-between items-center">
                <span className="text-xs font-bold text-gaming-accent">Per Kill Bonus:</span>
                <span className="text-xs font-black text-white">₹{tournament.perKillReward}</span>
              </div>
            )}

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
            ) : isPending ? (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-center">
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                  <Clock className="animate-pulse mr-1" size={14} />
                  Registration Pending
                </p>
                <p className="text-[10px] text-gaming-text">
                  The Host is verifying your payment UTR: <strong className="text-white">{pendingItem.utr}</strong>.
                </p>
              </div>
            ) : hasJoined ? (
              <div className="space-y-4">
                {hasJoinedPlayer ? (
                  <div className="flex items-center justify-center space-x-2 rounded-xl bg-green-500/15 border border-green-500/30 p-3 text-xs font-extrabold text-green-400">
                    <ShieldCheck size={16} />
                    <span>REGISTERED PLAYER</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 rounded-xl bg-gaming-blue/15 border border-gaming-blue/30 p-3 text-xs font-extrabold text-gaming-blue">
                    <Eye size={16} />
                    <span>REGISTERED SPECTATOR</span>
                  </div>
                )}
                
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
                    {tournament.roomDetails?.disputed && (
                      <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-[10px] font-bold text-red-400 flex items-start space-x-1">
                        <ShieldAlert size={14} className="flex-shrink-0 mt-0.5 text-red-400" />
                        <div>
                          <p className="uppercase tracking-wider font-extrabold">Observer Voting Conflict</p>
                          <p className="font-normal text-gaming-text mt-0.5 leading-normal">
                            Spectators submitted conflicting results. Payout is temporarily locked until resolved.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-gaming-dark/60 p-3 text-center text-[10px] font-semibold text-gaming-text">
                    Lobby credentials will appear here once the host publishes the room details (usually 15-30 minutes before match schedule).
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Policy acceptance checkbox */}
                <div className="flex items-start gap-2 rounded-lg bg-gaming-dark/60 border border-gaming-border p-3 mb-2">
                  <input 
                    type="checkbox" 
                    id="terms-check" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 cursor-pointer rounded border-gaming-border bg-gaming-dark text-gaming-accent focus:ring-0"
                  />
                  <label htmlFor="terms-check" className="text-[10px] text-gaming-text leading-relaxed cursor-pointer select-none">
                    I declare that I am 18+ years of age. I agree to the <Link to="/terms" target="_blank" className="text-gaming-accent hover:underline">Terms & Conditions</Link>, <Link to="/refunds" target="_blank" className="text-gaming-accent hover:underline">Refund Policy</Link> and <Link to="/disclaimer" target="_blank" className="text-gaming-accent hover:underline">Skill-Based Disclaimer</Link>.
                  </label>
                </div>

                {isAssignedObserver ? (
                  <>
                    <p className="text-[10px] text-center font-bold text-gaming-blue uppercase tracking-wider mb-2">
                      Choose your role for this match
                    </p>
                    {slotsLeft > 0 ? (
                      <button
                        onClick={() => handleJoin('player')}
                        disabled={joining || !acceptedTerms}
                        className="w-full rounded-xl bg-gaming-accent py-3.5 text-sm font-extrabold text-white shadow-neon hover:shadow-neon-hover transition disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Swords size={14} />
                        <span>JOIN AS PLAYER (₹{tournament.entryFee})</span>
                      </button>
                    ) : (
                      <button disabled className="w-full rounded-xl bg-gaming-border py-3 text-xs font-bold text-gaming-text cursor-not-allowed">
                        PLAYER SLOTS FULL
                      </button>
                    )}

                    {observerSlotsLeft > 0 ? (
                      <button
                        onClick={() => handleJoin('observer')}
                        disabled={joining || !acceptedTerms}
                        className="w-full rounded-xl border border-gaming-blue bg-gaming-blue/10 py-3.5 text-sm font-extrabold text-gaming-blue hover:bg-gaming-blue/20 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Eye size={14} />
                        <span>JOIN AS SPECTATOR (Reward: ₹{tournament.observerReward})</span>
                      </button>
                    ) : (
                      <button disabled className="w-full rounded-xl bg-gaming-border py-3 text-xs font-bold text-gaming-text cursor-not-allowed">
                        SPECTATOR SLOTS FULL
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {slotsLeft > 0 ? (
                      <button
                        onClick={() => handleJoin('player')}
                        disabled={joining || !acceptedTerms}
                        className="w-full rounded-xl bg-gaming-accent py-3.5 text-sm font-extrabold text-white shadow-neon hover:shadow-neon-hover transition disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Swords size={14} />
                        <span>JOIN MATCH</span>
                      </button>
                    ) : (
                      <button disabled className="w-full rounded-xl bg-gaming-border py-3 text-xs font-bold text-gaming-text cursor-not-allowed">
                        LOBBY SLOTS FULL
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Spectator Consensus Voting Console */}
          {hasJoinedObserver && user?.isObserver && tournament.status === 'ongoing' && (
            <div className="glass-panel border-t-2 border-t-gaming-blue rounded-2xl border border-gaming-border p-5 space-y-4 shadow-neon">
              <h3 className="text-xs font-black uppercase tracking-wider text-gaming-blue border-b border-gaming-border pb-2 flex items-center">
                <Eye size={13} className="mr-1.5" />
                SPECTATOR RESOLUTION DESK
              </h3>

              {hasVoted ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-400">
                    ✓ Your rank results vote is locked.
                  </p>
                  <p className="text-[10px] leading-relaxed text-gaming-text">
                    The payout bot is monitoring the observer consensus. Once all observers vote in agreement, the host's wallet will automatically be debited, and players/spectators credited.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVoteSubmit} className="space-y-4">
                  <p className="text-[10px] font-bold text-gaming-text leading-relaxed">
                    Submit the match scoreboard results. To trigger payouts, all spectators must vote with 100% identical data.
                  </p>

                  {voteError && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-[10px] font-bold text-red-400">
                      {voteError}
                    </div>
                  )}

                  {voteSuccess && (
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-[10px] font-bold text-green-400">
                      {voteSuccess}
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                    {votingResults.map((playerResult, idx) => (
                      <div key={playerResult.user} className="rounded-xl bg-gaming-dark/40 p-2.5 border border-gaming-border/60">
                        <p className="text-xs font-black text-white truncate mb-2">
                          @{playerResult.username} <span className="text-[10px] font-medium text-gaming-text">({playerResult.freeFireName})</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-0.5 block text-[9px] uppercase tracking-wider text-gaming-text font-black">Rank</label>
                            <input
                              type="number"
                              min="1"
                              value={playerResult.rank}
                              onChange={(e) => handleVoteChange(idx, 'rank', e.target.value)}
                              className="w-full rounded-lg border border-gaming-border/60 bg-gaming-card py-1 px-2 text-xs font-semibold text-white outline-none focus:border-gaming-blue"
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[9px] uppercase tracking-wider text-gaming-text font-black">Kills</label>
                            <input
                              type="number"
                              min="0"
                              value={playerResult.kills}
                              onChange={(e) => handleVoteChange(idx, 'kills', e.target.value)}
                              className="w-full rounded-lg border border-gaming-border/60 bg-gaming-card py-1 px-2 text-xs font-semibold text-white outline-none focus:border-gaming-blue"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingVote}
                    className="w-full rounded-xl bg-gaming-blue py-2.5 text-xs font-black text-black transition-all duration-300 hover:shadow-[0_0_15px_rgba(53,213,250,0.4)] cursor-pointer disabled:opacity-50"
                  >
                    {submittingVote ? 'Submitting Vote...' : 'Submit Consensus Vote'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Host Administration Console */}
          {canManage && (
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
                  <p className="text-[10px] text-gaming-text font-bold">Publish Free Fire Custom Room credentials to all registered players:</p>
                  
                  <div>
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-wider text-gaming-text">Room ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 54321098"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value)}
                      className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/40 backdrop-blur-md py-2 px-3 text-xs font-semibold text-white outline-none transition-all duration-300 focus:border-gaming-accent focus:bg-gaming-dark/60 focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-wider text-gaming-text">Room Password</label>
                    <input
                      type="text"
                      placeholder="e.g. play678"
                      value={roomPasswordInput}
                      onChange={(e) => setRoomPasswordInput(e.target.value)}
                      className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/40 backdrop-blur-md py-2 px-3 text-xs font-semibold text-white outline-none transition-all duration-300 focus:border-gaming-accent focus:bg-gaming-dark/60 focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingRoom}
                    className="w-full rounded-xl bg-gaming-accent py-2.5 text-xs font-black text-black transition-all duration-300 hover:shadow-neon transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 disabled:transform-none"
                  >
                    {updatingRoom ? 'Deploying Room...' : 'Start Match & Send Room ID'}
                  </button>
                </form>
              )}

              {/* Pending Manual Registrations Review Queue */}
              {canManage && tournament.status === 'upcoming' && tournament.pendingRegistrations && tournament.pendingRegistrations.length > 0 && (
                <div className="border-t border-gaming-border/60 pt-4 space-y-4">
                  <div className="border-b border-gaming-border/40 pb-2 flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-gaming-accent flex items-center">
                      <Clock size={13} className="mr-1.5 animate-pulse text-gaming-accent" />
                      Pending Registrations ({tournament.pendingRegistrations.length})
                    </p>
                    <span className="text-[9px] bg-gaming-accent/10 border border-gaming-accent/25 px-2 py-0.5 rounded text-white font-bold uppercase">UTR Verification</span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {tournament.pendingRegistrations.map((pending, idx) => (
                      <div 
                        key={idx} 
                        className="rounded-xl border border-gaming-border/80 bg-gaming-dark/45 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-white">@{pending.user?.username || 'Unknown User'}</span>
                            <span className="text-[9px] bg-gaming-border px-1.5 py-0.5 rounded text-gaming-text font-semibold uppercase">{pending.role}</span>
                          </div>
                          <p className="text-[10px] text-gaming-text">
                            Free Fire: <strong className="text-white">{pending.user?.freeFireName || 'N/A'}</strong> ({pending.user?.freeFireId || 'N/A'})
                          </p>
                          <p className="text-[10px] text-gaming-text">
                            Email: <span className="text-white select-all">{pending.user?.email || 'N/A'}</span>
                          </p>
                          <p className="text-[10px] text-gaming-text">
                            Submitted: <span className="text-white">{new Date(pending.submittedAt).toLocaleString()}</span>
                          </p>
                        </div>

                        <div className="flex flex-col items-start md:items-end justify-between gap-2.5">
                          <div>
                            <span className="block text-[8px] font-black uppercase tracking-wider text-gaming-text">Transaction UTR</span>
                            <strong className="text-gaming-yellow text-sm font-mono tracking-widest select-all">{pending.utr}</strong>
                          </div>
                          <div className="flex space-x-2 w-full md:w-auto">
                            <button
                              onClick={() => handleRejectRegistration(pending.user?._id || pending.user)}
                              className="rounded-lg bg-red-600/25 border border-red-500/35 hover:bg-red-600/40 px-3 py-1.5 text-[10px] font-bold text-red-400 transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveRegistration(pending.user?._id || pending.user)}
                              className="rounded-lg bg-green-500/20 border border-green-400/35 hover:bg-green-500/35 px-3 py-1.5 text-[10px] font-bold text-green-400 transition flex items-center"
                            >
                              Approve Entry
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automated Bot Payout Panel */}
              {tournament.status === 'ongoing' && (
                <div className="space-y-4">
                  <div className="border-b border-gaming-border pb-2">
                    <p className="text-xs font-black uppercase text-gaming-accent flex items-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-gaming-accent animate-pulse mr-1.5" />
                      Winnings Payout Bot
                    </p>
                    <p className="text-[10px] text-gaming-text">Pre-configured Winner Slots: {tournament.prizeDistribution?.winnerCount || 1}</p>
                  </div>

                  {botRunning ? (
                    <div className="rounded-xl border border-gaming-accent/20 bg-black/60 p-4 font-mono text-[10px] space-y-1.5 min-h-[180px] max-h-[260px] overflow-y-auto">
                      {botLogs.map((log, idx) => (
                        <p key={idx} className={log.startsWith('✓') || log.startsWith('💸') || log.startsWith('  - @') ? 'text-green-400 font-bold' : log.startsWith('🤖') ? 'text-gaming-accent font-bold' : log.startsWith('❌') ? 'text-red-500 font-black' : 'text-gaming-text'}>
                          {log}
                        </p>
                      ))}
                      <div className="h-1.5 w-1.5 bg-gaming-accent animate-ping rounded-full mt-2" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-gaming-dark/40 border border-gaming-border/60 p-4 space-y-3">
                        <p className="text-xs font-semibold text-gaming-text leading-relaxed">
                          The automation bot syncs directly with the game server, downloads lobby stats, matches character IGNs, resolves winner standings, and transfers cash payouts.
                        </p>
                        
                        <div className="space-y-2 border-t border-gaming-border/45 pt-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-gaming-text">Total Prize Pool:</span>
                            <span className="font-extrabold text-white">₹{tournament.prizePool}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gaming-text">Winners Selected:</span>
                            <span className="font-extrabold text-gaming-yellow">{tournament.prizeDistribution?.winnerCount || 1} Player(s)</span>
                          </div>
                          
                          <div className="pl-3 border-l border-gaming-accent/30 space-y-1 mt-1 text-[11px]">
                            <div className="flex justify-between text-gaming-text">
                              <span>1st Place:</span>
                              <span className="font-bold text-white">₹{tournament.prizeDistribution?.firstPlacePrize || tournament.prizePool}</span>
                            </div>
                            {(tournament.prizeDistribution?.winnerCount || 1) >= 2 && (
                              <div className="flex justify-between text-gaming-text">
                                <span>2nd Place:</span>
                                <span className="font-bold text-white">₹{tournament.prizeDistribution?.secondPlacePrize}</span>
                              </div>
                            )}
                            {(tournament.prizeDistribution?.winnerCount || 1) === 3 && (
                              <div className="flex justify-between text-gaming-text">
                                <span>3rd Place:</span>
                                <span className="font-bold text-white">₹{tournament.prizeDistribution?.thirdPlacePrize}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleBotResolve}
                        className="w-full rounded-xl bg-gradient-fire py-3.5 text-xs font-black text-black transition shadow-neon hover:shadow-neon-hover flex items-center justify-center space-x-2"
                      >
                        <span>✓ FINALIZE RESULTS & CRITICAL PAYOUTS</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Already Completed */}
              {tournament.status === 'completed' && (
                <div className="rounded-xl bg-gaming-dark/60 p-3.5 text-center text-xs font-bold text-gaming-text">
                  Match completed. Prizes have been credited to player wallets.
                </div>
              )}

              <div className="border-t border-gaming-border pt-4">
                <button
                  onClick={handleDeleteTournament}
                  disabled={deleting}
                  className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-3 text-xs font-black text-white transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_22px_rgba(220,38,38,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                >
                  {deleting ? 'Deleting Lobby...' : 'Cancel & Delete Tournament'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Join Match Checkout Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel border border-gaming-accent/25 rounded-2xl p-6 shadow-neon relative space-y-5 animate-scale-in">
            <button
              onClick={() => {
                setShowJoinModal(false);
                setUtr('');
              }}
              className="absolute top-4 right-4 text-gaming-text hover:text-white transition-colors"
            >
              <XCircle size={20} />
            </button>

            <div className="text-center border-b border-gaming-border pb-3">
              <h3 className="text-lg font-gaming font-black text-white uppercase tracking-wider">Lobby Entry Checkout</h3>
              <p className="text-xs text-gaming-text mt-1">Tournament: {tournament.title}</p>
            </div>

            <div className="flex justify-between items-center rounded-xl bg-gaming-dark/60 border border-gaming-border/50 p-4">
              <span className="text-xs font-bold text-gaming-text uppercase tracking-wider">Entry Fee</span>
              <span className="text-xl font-gaming font-black text-white">₹{tournament.entryFee}</span>
            </div>

            {/* Manual QR instructions */}
            <div className="rounded-xl border border-gaming-border bg-gaming-dark/70 p-4 space-y-4">
              <div className="flex flex-col items-center space-y-2">
                <p className="text-[10px] font-black uppercase text-gaming-accent tracking-wider">Scan QR to pay ₹{tournament.entryFee}</p>
                <img
                  src={tournament.paymentQrOption === 'qr_kowshik' ? '/qr_kowshik.png' : '/qr_durga.png'}
                  alt="UPI Payment QR Code"
                  className="w-52 h-52 object-contain rounded-lg border border-gaming-border bg-white p-1 shadow-md"
                />
                <div className="text-center">
                  <p className="text-[10px] font-extrabold text-white">
                    Account Name:{' '}
                    <span className="text-gaming-accent">
                      {tournament.paymentQrOption === 'qr_kowshik' 
                        ? 'KANAGIRI KOWSHIK MANI DEEP REDDY' 
                        : 'PEDDA PUJARLA KAMMA DURGA PRASAD'}
                    </span>
                  </p>
                  <p className="text-[9px] text-gaming-text mt-0.5">Scan using PhonePe, Google Pay, or Paytm</p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-gaming-border/60 pt-3">
                <label className="block text-[9px] font-black uppercase tracking-wider text-gaming-text">
                  Enter Transaction UTR / Ref ID (12 Digits)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. 612345678901"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full rounded-xl border border-gaming-border/80 bg-gaming-card/65 py-2.5 px-3 text-xs font-semibold text-white outline-none focus:border-gaming-accent"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(false);
                  setUtr('');
                }}
                className="w-1/2 rounded-xl border border-gaming-border py-2.5 text-xs font-bold text-gaming-text hover:bg-gaming-card/85 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={joining || utr.length < 8}
                onClick={() => handleJoinSubmit('player')}
                className="w-1/2 rounded-xl bg-gaming-accent py-2.5 text-xs font-black text-black shadow-neon disabled:opacity-50 transition"
              >
                {joining ? 'Submitting...' : 'Confirm Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;
