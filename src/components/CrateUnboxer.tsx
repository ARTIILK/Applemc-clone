import React, { useState, useEffect } from 'react';
import { Key, Gift, AlertCircle, RefreshCw, Trophy } from 'lucide-react';
import { PlayerStats, UnboxingReward } from '../types';
import { UNBOXING_REWARDS } from '../data';

interface CrateUnboxerProps {
  stats: PlayerStats;
  onDeductKey: (crateType: 'mythic' | 'ancient' | 'divine') => void;
  onGrantReward: (reward: UnboxingReward) => void;
}

export default function CrateUnboxer({ stats, onDeductKey, onGrantReward }: CrateUnboxerProps) {
  const [activeCrate, setActiveCrate] = useState<'mythic' | 'ancient' | 'divine'>('mythic');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinIndex, setSpinIndex] = useState(0);
  const [winReward, setWinReward] = useState<UnboxingReward | null>(null);
  const [spinList, setSpinList] = useState<UnboxingReward[]>([]);

  // Prepare a random long list of items for the spinning visual feed
  const generateSpinList = () => {
    const list: UnboxingReward[] = [];
    for (let i = 0; i < 40; i++) {
      const idx = Math.floor(Math.random() * UNBOXING_REWARDS.length);
      list.push({
        ...UNBOXING_REWARDS[idx],
        id: `spin-${i}-${UNBOXING_REWARDS[idx].id}`
      });
    }
    return list;
  };

  const handleSpin = () => {
    const keyCount = activeCrate === 'mythic' 
      ? stats.keys.mythic 
      : activeCrate === 'ancient' 
        ? stats.keys.ancient 
        : stats.keys.divine;

    if (keyCount <= 0) {
      alert(`You do not have any ${activeCrate} keys left! Purchase some divine bundles in the Store first.`);
      return;
    }

    // Deduct key on parent
    onDeductKey(activeCrate);
    setIsSpinning(true);
    setWinReward(null);

    const fullSpinList = generateSpinList();
    setSpinList(fullSpinList);

    // Target index is close to the end (e.g., 34)
    const targetIdx = 32 + Math.floor(Math.random() * 5);
    const winItem = fullSpinList[targetIdx];

    let current = 0;
    let delay = 50;

    const tick = () => {
      setSpinIndex(current);
      if (current < targetIdx) {
        current++;
        // Gradually increase delay as it gets closer to the prize (deceleration effect)
        if (targetIdx - current < 8) {
          delay += 60;
        } else if (targetIdx - current < 15) {
          delay += 25;
        }
        setTimeout(tick, delay);
      } else {
        // Complete spin
        setTimeout(() => {
          setIsSpinning(false);
          setWinReward(winItem);
          onGrantReward(winItem);
        }, 300);
      }
    };

    setTimeout(tick, delay);
  };

  const currentCrateKeyCount = activeCrate === 'mythic' 
    ? stats.keys.mythic 
    : activeCrate === 'ancient' 
      ? stats.keys.ancient 
      : stats.keys.divine;

  return (
    <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col gap-6">
      {/* Glow Effects */}
      <div className="absolute right-0 bottom-0 w-64 h-64 ambient-glow rounded-full translate-y-1/2 opacity-30"></div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary-mint tracking-tight flex items-center gap-2">
            <Trophy size={18} />
            CRATE UNBOXING SANCTUARY
          </h2>
          <p className="text-xs text-text-muted">Spend your keys to win custom epic weapons, ranks, or coins</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary-mint font-semibold px-2.5 py-1 rounded bg-primary-mint/10 border border-primary-mint/20">
          <Key size={12} className="animate-pulse" />
          <span>My Keys: {stats.keys.ancient} A / {stats.keys.mythic} M / {stats.keys.divine} D</span>
        </div>
      </div>

      {/* Crate Tabs Select */}
      <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-emerald-surface-low border border-white/5">
        {(['ancient', 'mythic', 'divine'] as const).map((type) => {
          const count = type === 'mythic' ? stats.keys.mythic : type === 'ancient' ? stats.keys.ancient : stats.keys.divine;
          return (
            <button
              key={type}
              onClick={() => !isSpinning && setActiveCrate(type)}
              disabled={isSpinning}
              className={`py-2 rounded px-1 text-center transition-all flex flex-col items-center gap-0.5 ${
                activeCrate === type 
                  ? 'bg-primary-mint/10 text-primary-mint font-bold text-xs ring-1 ring-primary-mint/30' 
                  : 'text-text-muted hover:text-text-primary text-xs disabled:opacity-50'
              }`}
            >
              <span className="capitalize font-sans tracking-wide text-[11px]">{type} Chest</span>
              <span className="text-[10px] font-mono opacity-80">{count} active</span>
            </button>
          );
        })}
      </div>

      {/* Box View */}
      <div className="relative h-44 rounded-xl bg-emerald-surface-low/80 border border-white/5 flex flex-col items-center justify-center overflow-hidden">
        {isSpinning && spinList.length > 0 ? (
          <div className="w-full relative flex flex-col items-center justify-center">
            {/* Center Pointer indicator */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-primary-mint z-20 shadow-[0_0_12px_#B9EED6]"></div>
            
            {/* Sliding ribbon */}
            <div className="w-full flex justify-center items-center pointer-events-none select-none">
              <div 
                className="flex gap-2 items-center transition-transform duration-100 ease-out"
                style={{
                  transform: `translateX(calc(50% - ${spinIndex * 128 + 60}px))`
                }}
              >
                {spinList.map((item, i) => (
                  <div
                    key={item.id}
                    className={`shrink-0 w-32 h-24 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-center items-center p-2 text-center text-xs relative overflow-hidden ${
                      spinIndex === i ? 'ring-2 ring-primary-mint/80 bg-primary-mint/10' : 'opacity-55'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`}></div>
                    <span className="font-bold text-[10px] tracking-widest text-primary-mint capitalize mb-1">{item.rarity}</span>
                    <span className="text-text-primary px-1 truncate w-full text-[11px] font-semibold">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : winReward ? (
          // Winning State Showcase!
          <div className="text-center p-4 flex flex-col items-center gap-2 animate-fade-in relative z-10">
            <div className={`absolute inset-0 bg-gradient-to-b ${winReward.color} opacity-5 blur-xl -z-10`}></div>
            <div className="w-14 h-14 rounded-full bg-primary-mint/15 shadow-[0_0_15px_rgba(184,238,214,0.3)] flex items-center justify-center text-primary-mint mb-1 animate-bounce">
              <Gift size={24} />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-teal-400">UNBOXED REWARD</span>
            <h3 className="text-md font-bold text-text-primary">{winReward.name}</h3>
            <p className="text-xs text-text-muted max-w-[320px]">{winReward.description}</p>
          </div>
        ) : (
          // Default Idle State
          <div className="text-center p-6 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-primary-mint/40 mb-1">
              <Key size={20} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Unlock the {activeCrate} crate</h3>
            <p className="text-xs text-text-muted max-w-[280px]">Deduct 1 key from your active balance to spin the reward selector.</p>
          </div>
        )}
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || currentCrateKeyCount <= 0}
        className="py-3.5 bg-primary-mint text-on-primary-mint font-bold rounded-xl btn-glow transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:hover:shadow-none"
      >
        {isSpinning ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            <span>CRATE SPINNING...</span>
          </>
        ) : (
          <>
            <Key size={16} />
            <span>SPIN CHEST (Cost: 1 Key)</span>
          </>
        )}
      </button>

      {/* Guarantee disclaimer */}
      <div className="flex gap-2 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
        <AlertCircle size={15} className="text-primary-mint shrink-0 mt-0.5" />
        <span className="text-[11px] text-text-muted leading-relaxed">
          Unboxing rates on AppleMC are fully server-authoritative and completely fair. Real ranks and items will link directly to your linked profile inventory immediately upon spinning!
        </span>
      </div>
    </div>
  );
}
