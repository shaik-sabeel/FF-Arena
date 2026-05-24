import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { User, Swords, Award, Star, Compass, Play, Calendar, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const fetchUserMatches = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await API.get('/tournament');
        
        // Filter tournaments where current user is in playersJoined
        const joined = res.data.filter((t) => {
          const userId = user.id || user._id;
          return t.playersJoined?.some((p) => {
            const pId = p._id || p;
            return pId.toString() === userId?.toString();
          });
        });
        setMyMatches(joined);
      } catch (err) {
        console.error('Failed to load user tournaments', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMatches();
  }, [user]);

  // GSAP animation
  useEffect(() => {
    if (user) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.9, rotateX: -15, opacity: 0 },
        { scale: 1, rotateX: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );

      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
        );
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-gaming-accent border-t-transparent" />
      </div>
    );
  }

  // Calculate statistics
  const { matchesPlayed = 0, matchesWon = 0, matchesLost = 0, kills = 0, earnings = 0 } = user.stats || {};
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
  const kdRatio = matchesPlayed > 0 ? (kills / Math.max(matchesLost + matchesWon, 1)).toFixed(2) : '0.00';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 safe-bottom">
      
      {/* Free Fire Hologram Gamer ID Card */}
      <div
        ref={cardRef}
        style={{ perspective: 1000 }}
        className="glass-panel relative mb-8 overflow-hidden rounded-3xl border border-gaming-accent/20 bg-gradient-to-br from-gaming-card to-gaming-dark p-6 shadow-neon"
      >
        <div className="absolute right-0 top-0 -translate-y-6 translate-x-6 select-none opacity-5">
          <Zap size={220} className="text-gaming-accent" />
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            {/* Holographic Avatar Border */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-fire p-0.5 shadow-neon">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-gaming-dark text-gaming-accent">
                <User size={30} />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white uppercase">{user.username}</h2>
                <span className="rounded bg-gaming-accent/15 border border-gaming-accent/20 px-2 py-0.5 text-[9px] font-extrabold uppercase text-gaming-accent">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gaming-text">{user.email}</p>
            </div>
          </div>

          {/* In-Game Name / UID Display panel */}
          <div className="rounded-2xl border border-gaming-border bg-gaming-dark/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gaming-accent">Free Fire Profile</p>
            
            {user.freeFireId ? (
              <div className="mt-1.5 space-y-1">
                <p className="text-xs font-medium text-gaming-text">
                  IGN:{' '}
                  <span className="font-extrabold text-white font-gaming text-sm bg-gaming-accent/10 px-2 py-0.5 rounded border border-gaming-accent/20">
                    {user.freeFireName}
                  </span>
                </p>
                <p className="text-xs font-medium text-gaming-text">
                  Character UID:{' '}
                  <span className="font-mono font-bold text-white text-sm">{user.freeFireId}</span>
                </p>
              </div>
            ) : (
              <div className="mt-1.5 flex items-center text-xs font-semibold text-yellow-500">
                <AlertTriangle size={13} className="mr-1" />
                No Game ID linked.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Stat blocks */}
      <div
        ref={statsRef}
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <div className="glass-panel rounded-2xl border border-gaming-border p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gaming-text">Matches Played</p>
          <p className="mt-1.5 text-2xl font-black text-white">{matchesPlayed}</p>
        </div>

        <div className="glass-panel rounded-2xl border border-gaming-border p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gaming-text">Win Rate</p>
          <div className="mt-1 flex items-center justify-center space-x-1">
            <span className="text-2xl font-black text-gaming-yellow">{winRate}%</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-gaming-border p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gaming-text">K/D Ratio</p>
          <p className="mt-1.5 text-2xl font-black text-gaming-blue flex items-center justify-center">
            <Swords size={18} className="mr-1" />
            {kdRatio}
          </p>
        </div>

        <div className="glass-panel rounded-2xl border border-gaming-border p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gaming-text">Winnings</p>
          <p className="mt-1.5 text-2xl font-black text-green-400">₹{earnings}</p>
        </div>
      </div>

      {/* Sub List: User Registered Tournaments */}
      <div className="glass-panel rounded-2xl border border-gaming-border p-5">
        <h3 className="mb-4 flex items-center text-sm font-bold uppercase tracking-wider text-white border-b border-gaming-border pb-3">
          <Compass size={16} className="mr-1.5 text-gaming-accent" />
          My Scheduled Matches ({myMatches.length})
        </h3>

        {loading ? (
          <div className="flex h-20 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-gaming-accent border-t-transparent" />
          </div>
        ) : myMatches.length === 0 ? (
          <div className="py-6 text-center text-xs font-semibold text-gaming-text">
            You haven't joined any match lobbies yet. Go to the dashboard to register.
          </div>
        ) : (
          <div className="space-y-4">
            {myMatches.map((match) => (
              <div
                key={match._id}
                className="flex flex-col justify-between rounded-xl bg-gaming-dark/50 border border-gaming-border/60 p-4 hover:border-gaming-accent/30 transition sm:flex-row sm:items-center"
              >
                <div className="mb-3 sm:mb-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-white text-sm">{match.title}</h4>
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase border ${
                      match.status === 'upcoming' 
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                        : match.status === 'ongoing' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                          : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {match.status}
                    </span>
                  </div>
                  
                  <p className="mt-1 text-[10px] text-gaming-text font-medium flex items-center">
                    <Calendar size={12} className="mr-1 text-gaming-accent" />
                    {new Date(match.matchDateTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Custom room access token (only shown if joined and match active) */}
                <div className="rounded-xl border border-gaming-border bg-gaming-card/60 p-3 flex flex-col justify-center sm:text-right">
                  {match.status === 'ongoing' && match.roomDetails?.roomId ? (
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-green-400 font-extrabold flex items-center sm:justify-end">
                        <ShieldCheck size={11} className="mr-0.5 animate-pulse" /> Live Custom Room Credentials
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gaming-text">
                        Room ID: <span className="font-mono text-white font-bold">{match.roomDetails.roomId}</span>
                      </p>
                      <p className="text-xs font-semibold text-gaming-text">
                        Password: <span className="font-mono text-white font-bold">{match.roomDetails.roomPassword}</span>
                      </p>
                    </div>
                  ) : match.status === 'upcoming' ? (
                    <p className="text-[10px] font-bold text-gaming-text">
                      Credentials shared when match is live
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold text-gaming-accent">
                      Match completed
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Profile;
