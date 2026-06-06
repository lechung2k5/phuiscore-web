import React from 'react';
import { motion } from 'framer-motion';

const ScoreboardTop = ({ zIndex, match }) => {
  if (!match) return null;

  const { teamA, teamB, clock, period, status, extraTime } = match;

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ zIndex }}
      className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-stretch h-14 bg-black/80 backdrop-blur-md rounded-lg overflow-hidden border border-white/20 shadow-2xl"
    >
      {/* Team A */}
      <div className="flex items-center px-4 min-w-[200px] bg-gradient-to-r from-black/60 to-transparent">
        <img src={teamA.logo} alt={teamA.name} className="w-8 h-8 object-contain mr-3" />
        <span className="font-bold text-xl uppercase tracking-wider">{teamA.shortName}</span>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center px-6 bg-amber-500 text-black font-black text-3xl min-w-[120px]">
        {teamA.score} - {teamB.score}
      </div>

      {/* Team B */}
      <div className="flex items-center px-4 min-w-[200px] bg-gradient-to-l from-black/60 to-transparent justify-end">
        <span className="font-bold text-xl uppercase tracking-wider mr-3">{teamB.shortName}</span>
        <img src={teamB.logo} alt={teamB.name} className="w-8 h-8 object-contain" />
      </div>

      {/* Time & Period */}
      <div className="flex flex-col items-center justify-center px-4 bg-white/10 min-w-[100px] border-l border-white/20">
        <div className="text-xl font-bold font-mono tracking-widest">{clock}</div>
        <div className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">
          {status === 'HALF_TIME' ? 'Nghỉ giữa hiệp' : period}
          {extraTime > 0 && <span className="text-red-500 ml-1">+{extraTime}'</span>}
        </div>
      </div>
    </motion.div>
  );
};

export default ScoreboardTop;
