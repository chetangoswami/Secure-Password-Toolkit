import React from 'react';
import { StrengthLevel } from '../types';

interface StrengthIndicatorProps {
  strength: StrengthLevel;
}

const StrengthIndicator: React.FC<StrengthIndicatorProps> = ({ strength }) => {
  const strengthConfig = {
    [StrengthLevel.EMPTY]: { text: '', width: '0%', color: 'bg-slate-700' },
    [StrengthLevel.VERY_WEAK]: { text: 'POOR', width: '25%', color: 'from-red-600 to-red-500' },
    [StrengthLevel.WEAK]: { text: 'FAIR', width: '50%', color: 'from-orange-500 to-yellow-500' },
    [StrengthLevel.MEDIUM]: { text: 'GOOD', width: '75%', color: 'from-yellow-500 to-emerald-500' },
    [StrengthLevel.STRONG]: { text: 'EXCELLENT', width: '100%', color: 'from-emerald-500 to-green-400' },
  };

  const { text, width, color } = strengthConfig[strength];
  const isNotEmpty = strength !== StrengthLevel.EMPTY;

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg">
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
    </div>
  );
};

export default StrengthIndicator;
