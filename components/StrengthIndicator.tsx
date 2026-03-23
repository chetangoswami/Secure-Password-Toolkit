import React from 'react';
import { StrengthLevel } from '../types';

interface StrengthIndicatorProps {
  strength: StrengthLevel;
  entropy?: number;
}

const StrengthIndicator: React.FC<StrengthIndicatorProps> = ({ strength, entropy = 0 }) => {
  const strengthConfig = {
    [StrengthLevel.EMPTY]: { text: '', width: '0%', color: 'bg-slate-700' },
    [StrengthLevel.VERY_WEAK]: { text: 'POOR', width: '25%', color: 'from-red-600 to-red-500' },
    [StrengthLevel.WEAK]: { text: 'FAIR', width: '50%', color: 'from-orange-500 to-yellow-500' },
    [StrengthLevel.MEDIUM]: { text: 'GOOD', width: '75%', color: 'from-yellow-500 to-emerald-500' },
    [StrengthLevel.STRONG]: { text: 'EXCELLENT', width: '100%', color: 'from-emerald-500 to-green-400' },
  };

  const formatCrackTime = (bits: number): string => {
    if (bits === 0) return 'Instant';
    // Assume consumer GPU cracks ~100 billion hashes/sec
    const hashesPerSecond = 100_000_000_000;
    const seconds = Math.pow(2, bits) / hashesPerSecond;

    if (seconds < 1) return '< 1 second';
    if (seconds < 60) return `${Math.floor(seconds)} second${Math.floor(seconds) === 1 ? '' : 's'}`;
    
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)} minute${Math.floor(minutes) === 1 ? '' : 's'}`;
    
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)} hour${Math.floor(hours) === 1 ? '' : 's'}`;
    
    const days = hours / 24;
    if (days < 365) return `${Math.floor(days)} day${Math.floor(days) === 1 ? '' : 's'}`;
    
    const years = days / 365;
    if (years < 100) return `${Math.floor(years)} year${Math.floor(years) === 1 ? '' : 's'}`;
    if (years < 1000) return 'centuries';
    return 'millennia or more';
  };

  const { text, width, color } = strengthConfig[strength];
  const isNotEmpty = strength !== StrengthLevel.EMPTY;
  const crackTime = formatCrackTime(entropy);

  return (
    <div className="bg-slate-900/50 p-3 sm:p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400 font-bold text-sm sm:text-base">STRENGTH</span>
        {isNotEmpty && <span className="text-white font-bold text-sm sm:text-lg">{text}</span>}
      </div>
      <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden border border-slate-700/50">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500 ease-out`}
          style={{ width: width }}
        ></div>
      </div>
      {isNotEmpty && (
        <div className="mt-3 flex justify-between items-center text-xs text-slate-400 border-t border-slate-700/50 pt-2">
           <span>Entropy: {Math.round(entropy)} bits</span>
           <span>Crack time: {crackTime}</span>
        </div>
      )}
    </div>
  );
};

export default StrengthIndicator;
