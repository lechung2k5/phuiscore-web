import React from 'react';
import { motion } from 'framer-motion';

const PrematchBanner = ({ zIndex, match }) => {
  if (!match) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ zIndex }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1200px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="bg-amber-500 text-black text-center py-4 text-3xl font-black uppercase tracking-widest">
        {match.tournamentName}
      </div>
      
      <div className="flex justify-between items-center p-16">
        <div className="flex flex-col items-center w-1/3">
          <img src={match.teamA.logo} alt={match.teamA.name} className="w-64 h-64 object-contain mb-6 drop-shadow-2xl" />
          <h2 className="text-4xl font-bold text-center uppercase">{match.teamA.name}</h2>
        </div>
        
        <div className="flex flex-col items-center w-1/3">
          <div className="text-6xl font-black text-amber-500 mb-4">VS</div>
          <div className="text-xl text-gray-300 uppercase tracking-widest mb-2">{match.roundName}</div>
          <div className="text-lg text-gray-400">{match.stadium}</div>
        </div>
        
        <div className="flex flex-col items-center w-1/3">
          <img src={match.teamB.logo} alt={match.teamB.name} className="w-64 h-64 object-contain mb-6 drop-shadow-2xl" />
          <h2 className="text-4xl font-bold text-center uppercase">{match.teamB.name}</h2>
        </div>
      </div>
    </motion.div>
  );
};

export default PrematchBanner;
