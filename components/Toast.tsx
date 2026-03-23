import React from 'react';
import { CheckIcon } from './Icons';

interface ToastProps {
  message: string;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl shadow-emerald-500/20 bg-slate-800 border border-emerald-500/30 text-emerald-400 font-bold tracking-wide 
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
    >
      <CheckIcon className="w-5 h-5 text-emerald-400" />
      <span>{message}</span>
    </div>
  );
};

export default Toast;
