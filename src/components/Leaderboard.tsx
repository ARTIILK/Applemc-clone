import React, { useState } from 'react';
import { Trophy, Star, ArrowUpRight, Flame } from 'lucide-react';
import { LEADERBOARD_ENTRIES } from '../data';

interface LeaderboardProps {
  currentUsername: string;
}

export default function Leaderboard({ currentUsername }: LeaderboardProps) {
  const [voteCount, setVoteCount] = useState(14);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVoteSimulate = () => {
    if (hasVoted) return;
    setVoteCount(prev => prev + 1);
    setHasVoted(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Donors Board */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col gap-4">
        <div className="absolute top-0 right-0 w-44 h-44 ambient-glow rounded-full translate-x-1/2 -translate-y-1/2 opacity-35"></div>
        
        <div>
          <h3 className="text-sm font-bold text-primary-mint tracking-tight flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            TOP STORE DONORS
          </h3>
          <p className="text-[11px] text-text-muted">This month's supreme supporters on AppleMC</p>
        </div>

        <div className="flex flex-col gap-3">
          {LEADERBOARD_ENTRIES.map((entry, idx) => (
            <div 
              key={entry.rank}
              className={`p-3 rounded-xl flex items-center justify-between border transition-all ${
                idx === 0 
                  ? 'bg-primary-mint/5 border-primary-mint/20' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Seed index badge */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                  idx === 0 
                    ? 'bg-yellow-400 text-emerald-bg' 
                    : idx === 1 
                      ? 'bg-gray-300 text-emerald-bg' 
                      : idx === 2 
                        ? 'bg-orange-400 text-emerald-bg' 
                        : 'bg-white/5 text-text-muted'
                }`}>
                  {entry.rank}
                </div>
                {/* Face avatar */}
                <img 
                  src={entry.avatarUrl} 
                  alt={entry.player} 
                  className="w-8 h-8 rounded-full border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-semibold text-text-primary">{entry.player}</span>
              </div>
              <span className="text-xs font-mono font-bold text-primary-mint">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Vote Booster widget */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-surface-container to-emerald-surface-low border border-primary-mint/15 flex flex-col gap-1 text-center">
        <div className="w-10 h-10 rounded-full bg-primary-mint/10 flex items-center justify-center text-primary-mint mx-auto mb-2">
          <Star size={18} fill="currentColor" />
        </div>
        <h3 className="text-xs font-bold text-text-primary tracking-tight">DAILY SERVER VOTE</h3>
        <p className="text-[11px] text-text-muted px-2">Support our directory registry list to receive 1 Free Mythic Key daily.</p>
        
        <div className="my-3 py-2 bg-emerald-bg/50 rounded-lg max-w-[150px] mx-auto w-full border border-white/5">
          <span className="block text-[10px] text-text-muted tracking-widest uppercase">My Votes</span>
          <span className="text-md font-bold text-primary-mint flex items-center justify-center gap-1">
            <Flame size={14} className="text-orange-400" />
            {voteCount} days streak
          </span>
        </div>

        <button 
          onClick={handleVoteSimulate}
          disabled={hasVoted}
          className={`py-2 px-4 rounded-lg text-xs font-bold w-full transition-all flex items-center justify-center gap-1.5 ${
            hasVoted 
              ? 'bg-teal-400/20 text-teal-300 pointer-events-none' 
              : 'bg-primary-mint text-on-primary-mint hover:shadow-[0_0_15px_rgba(184,238,214,0.3)]'
          }`}
        >
          <span>{hasVoted ? 'VOTE LOGGED TODAY!' : 'GENERATE DAILY VOTE'}</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}
