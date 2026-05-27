import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Award, MapPin, Swords } from 'lucide-react';

const TournamentCard = ({ tournament }) => {
  const {
    _id,
    title,
    gameMode,
    map,
    entryFee,
    prizePool,
    slots,
    playersJoined,
    matchDateTime,
    status
  } = tournament;

  const filledSlots = playersJoined?.length || 0;
  const isFull = filledSlots >= slots;
  const percentFilled = Math.min((filledSlots / slots) * 100, 100);

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Badge styles based on game mode
  const getModeBadge = (mode) => {
    switch (mode) {
      case 'BR Ranked':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Clash Squad':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Custom Room':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Lone Wolf':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="glass-panel card-cyber group relative overflow-hidden rounded-2xl border border-gaming-border">
      {/* Decorative Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gaming-accent via-gaming-purple to-gaming-orange opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="p-5">
        {/* Game Mode and Map */}
        <div className="mb-3.5 flex items-center justify-between">
          <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getModeBadge(gameMode)}`}>
            {gameMode}
          </span>
          <span className="flex items-center text-xs font-semibold text-gaming-text">
            <MapPin size={13} className="mr-1" />
            {map}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-3 text-lg font-bold text-white group-hover:text-gaming-accent transition-colors truncate">
          {title}
        </h3>

        {/* Info Grid */}
        <div className="mb-5 grid grid-cols-2 gap-3.5 rounded-xl bg-gaming-dark/60 p-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gaming-text font-semibold">Prize Pool</p>
            <p className="flex items-center text-sm font-extrabold text-gaming-yellow">
              <Award size={15} className="mr-1" />
              ₹{prizePool}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gaming-text font-semibold">Entry Fee</p>
            <p className="text-sm font-extrabold text-white">
              {entryFee === 0 ? (
                <span className="text-green-400 font-extrabold">FREE</span>
              ) : (
                `₹${entryFee}`
              )}
            </p>
          </div>
        </div>

        {/* Slots Filled Progress */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-gaming-text">
            <span className="flex items-center">
              <Users size={14} className="mr-1.5" />
              Slots
            </span>
            <span>
              {filledSlots}/{slots} ({Math.round(percentFilled)}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gaming-border/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-neon transition-all duration-500"
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>

        {/* Match Time & CTA */}
        <div className="flex items-center justify-between border-t border-gaming-border pt-4">
          <span className="flex items-center text-xs font-medium text-gaming-text">
            <Calendar size={14} className="mr-1.5" />
            {formatDate(matchDateTime)}
          </span>

          <Link
            to={`/tournament/${_id}`}
            className="flex items-center space-x-1 rounded-lg bg-gaming-accent/10 border border-gaming-accent/20 px-3.5 py-1.5 text-xs font-bold text-gaming-accent transition-all duration-350 group-hover:bg-gaming-accent group-hover:text-black group-hover:shadow-neon"
          >
            <Swords size={13} />
            <span>{isFull ? 'View Info' : 'Join Match'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
