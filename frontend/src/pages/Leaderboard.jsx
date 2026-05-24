import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { Trophy, Award, Crown, User, Swords, Coins } from 'lucide-react';
import gsap from 'gsap';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const podiumRef = useRef(null);
  const listRef = useRef(null);

  // Fallback demo rankings if DB is empty
  const fallbackPlayers = [
    { username: 'FF_Titan', freeFireName: '꧁T1T4N꧂', stats: { earnings: 2500, kills: 142, matchesWon: 28 } },
    { username: 'GamerGod', freeFireName: 'GOD_Viper', stats: { earnings: 1800, kills: 98, matchesWon: 19 } },
    { username: 'SlayerPro', freeFireName: 'Slayer××', stats: { earnings: 1200, kills: 84, matchesWon: 14 } },
    { username: 'BermudaKing', freeFireName: 'KingBermuda', stats: { earnings: 850, kills: 62, matchesWon: 9 } },
    { username: 'SquadWipe', freeFireName: 'WiperSquad', stats: { earnings: 600, kills: 55, matchesWon: 6 } },
    { username: 'HeadshotMax', freeFireName: 'HS_Max', stats: { earnings: 450, kills: 48, matchesWon: 4 } },
    { username: 'DangerZone', freeFireName: 'DangerZone', stats: { earnings: 200, kills: 23, matchesWon: 2 } }
  ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await API.get('/user/leaderboard');
        if (res.data && res.data.length > 0) {
          setPlayers(res.data);
        } else {
          setPlayers(fallbackPlayers);
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err);
        setPlayers(fallbackPlayers);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // GSAP animations
  useEffect(() => {
    if (!loading && players.length > 0) {
      // Animate top podium cards rising
      const podiumColumns = podiumRef.current?.children;
      if (podiumColumns) {
        gsap.fromTo(
          podiumColumns,
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'back.out(1.2)' }
        );
      }

      // Animate table rows staggered slide-in
      const tableRows = listRef.current?.children;
      if (tableRows) {
        gsap.fromTo(
          tableRows,
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.4 }
        );
      }
    }
  }, [loading, players]);

  // Extract top 3 and list players
  const top1 = players[0];
  const top2 = players[1];
  const top3 = players[2];
  const listPlayers = players.slice(3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 safe-bottom">
      {/* Title */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gaming-accent/10 text-gaming-accent shadow-neon">
          <Trophy size={26} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl uppercase font-gaming">
          Grand Leaderboards
        </h1>
        <p className="mt-1.5 text-xs text-gaming-text">
          Rankings of the top-earning tournament gladiators
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-gaming-accent border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          <div
            ref={podiumRef}
            className="mb-12 flex flex-col items-end justify-center gap-4 sm:flex-row sm:gap-6 sm:px-8"
          >
            {/* Rank 2 - Silver Medalist */}
            {top2 && (
              <div className="glass-panel group relative flex w-full flex-col items-center rounded-2xl border border-gaming-border/80 bg-gaming-card/40 p-5 text-center shadow-card transition duration-300 hover:border-gaming-text/30 sm:w-1/3">
                <div className="absolute top-0 left-1/2 h-1 w-16 -translate-x-1/2 bg-slate-400 opacity-60 group-hover:w-24 transition-all" />
                <div className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-400/10 text-slate-400 font-bold border border-slate-400/20">
                  2
                </div>
                <h3 className="text-sm font-extrabold text-white truncate max-w-full">
                  {top2.freeFireName || top2.username}
                </h3>
                <p className="text-[10px] text-gaming-text">@{top2.username}</p>
                
                {/* Visual Silver pedestal */}
                <div className="mt-4 flex w-full flex-col items-center rounded-xl bg-slate-400/5 border border-slate-400/10 p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-gaming-text">Earnings</p>
                  <p className="text-base font-black text-slate-300">₹{top2.stats?.earnings || 0}</p>
                  <p className="mt-1 text-[9px] text-gaming-text font-bold uppercase flex items-center">
                    <Swords size={10} className="mr-0.5" /> {top2.stats?.kills || 0} Kills
                  </p>
                </div>
              </div>
            )}

            {/* Rank 1 - Golden Champion */}
            {top1 && (
              <div className="glass-panel group relative z-10 flex w-full flex-col items-center rounded-3xl border border-gaming-yellow/20 bg-gaming-card/80 p-6 text-center shadow-neon sm:-translate-y-4 sm:w-1/3">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-gaming-yellow animate-bounce">
                  <Crown size={28} className="drop-shadow-[0_0_8px_rgba(255,179,0,0.6)]" />
                </div>
                <div className="absolute top-0 left-1/2 h-1 w-20 -translate-x-1/2 bg-gaming-yellow group-hover:w-28 transition-all" />
                <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gaming-yellow/10 text-gaming-yellow font-black border border-gaming-yellow/30 text-lg">
                  1
                </div>
                <h3 className="text-base font-black text-white truncate max-w-full">
                  {top1.freeFireName || top1.username}
                </h3>
                <p className="text-[10px] text-gaming-text">@{top1.username}</p>

                {/* Pedestal */}
                <div className="mt-4 flex w-full flex-col items-center rounded-xl bg-gaming-yellow/5 border border-gaming-yellow/10 p-3 shadow-glass">
                  <p className="text-[9px] uppercase tracking-wider text-gaming-text">Earnings</p>
                  <p className="text-lg font-black text-gaming-yellow glow-text-orange">₹{top1.stats?.earnings || 0}</p>
                  <p className="mt-1 text-[9px] text-gaming-text font-bold uppercase flex items-center">
                    <Swords size={10} className="mr-0.5" /> {top1.stats?.kills || 0} Kills
                  </p>
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze Medalist */}
            {top3 && (
              <div className="glass-panel group relative flex w-full flex-col items-center rounded-2xl border border-gaming-border/80 bg-gaming-card/40 p-5 text-center shadow-card transition duration-300 hover:border-amber-700/30 sm:w-1/3">
                <div className="absolute top-0 left-1/2 h-1 w-16 -translate-x-1/2 bg-amber-700 opacity-60 group-hover:w-24 transition-all" />
                <div className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-700/10 text-amber-600 font-bold border border-amber-700/20">
                  3
                </div>
                <h3 className="text-sm font-extrabold text-white truncate max-w-full">
                  {top3.freeFireName || top3.username}
                </h3>
                <p className="text-[10px] text-gaming-text">@{top3.username}</p>

                {/* Pedestal */}
                <div className="mt-4 flex w-full flex-col items-center rounded-xl bg-amber-700/5 border border-amber-700/10 p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-gaming-text">Earnings</p>
                  <p className="text-base font-black text-amber-600">₹{top3.stats?.earnings || 0}</p>
                  <p className="mt-1 text-[9px] text-gaming-text font-bold uppercase flex items-center">
                    <Swords size={10} className="mr-0.5" /> {top3.stats?.kills || 0} Kills
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Ranks 4+ */}
          {listPlayers.length > 0 && (
            <div className="glass-panel rounded-2xl border border-gaming-border overflow-hidden p-4">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gaming-text">Challenger Board</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gaming-border text-[10px] font-black uppercase text-gaming-text">
                      <th className="pb-3 pl-2">Rank</th>
                      <th className="pb-3">Player</th>
                      <th className="pb-3 text-center">Matches Won</th>
                      <th className="pb-3 text-center">Total Kills</th>
                      <th className="pb-3 text-right pr-2">Earnings</th>
                    </tr>
                  </thead>
                  <tbody ref={listRef}>
                    {listPlayers.map((player, idx) => {
                      const rank = idx + 4;
                      return (
                        <tr
                          key={player.username}
                          className="border-b border-gaming-border/40 hover:bg-gaming-card/30 transition text-xs"
                        >
                          <td className="py-3.5 pl-3 font-mono font-bold text-gaming-text">#{rank}</td>
                          <td className="py-3.5">
                            <div className="flex items-center space-x-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gaming-border text-gaming-text">
                                <User size={14} />
                              </div>
                              <div>
                                <p className="font-bold text-white">{player.freeFireName || player.username}</p>
                                <p className="text-[9px] text-gaming-text">@{player.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-center font-bold text-white">{player.stats?.matchesWon || 0}</td>
                          <td className="py-3.5 text-center font-bold text-gaming-blue flex items-center justify-center">
                            <Swords size={12} className="mr-1" />
                            {player.stats?.kills || 0}
                          </td>
                          <td className="py-3.5 text-right pr-3 font-extrabold text-gaming-yellow">₹{player.stats?.earnings || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
