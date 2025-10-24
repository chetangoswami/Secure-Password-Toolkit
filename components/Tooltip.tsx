import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  align?: 'center' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, align = 'center' }) => {
  const getAlignmentClass = () => {
    switch(align) {
      case 'left':
        return 'left-0';
      case 'right':
        return 'right-0';
      case 'center':
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div className="relative group flex items-center">
      {children}
      <div className={`absolute bottom-full ${getAlignmentClass()} mb-2 w-max max-w-xs bg-slate-900/80 backdrop-blur-sm text-white text-sm rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg border border-slate-700 text-center`}>
        {text}
      </div>
    </div>
  );
};

export default Tooltip;