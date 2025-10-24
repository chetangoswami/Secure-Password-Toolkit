import React, { useState, useRef, useCallback, MouseEvent, TouchEvent } from 'react';
import { HistoryItem } from '../types';
import { CopyIcon, TrashIcon, ExportIcon } from './Icons';
import Tooltip from './Tooltip';

interface PasswordHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onCopy: (password: string) => void;
  onDeleteItem: (timestamp: number) => void;
  onExport: () => void;
}

const formatTimeAgo = (timestamp: number): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - timestamp) / 1000);
  
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  
  let interval = seconds / 60;
  if (interval < 60) return Math.floor(interval) + " minutes ago";
  
  interval = seconds / 3600;
  if (interval < 24) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 86400;
  if (interval < 30) return Math.floor(interval) + " days ago";

  interval = seconds / 2592000;
  if (interval < 12) return Math.floor(interval) + " months ago";

  interval = seconds / 31536000;
  return Math.floor(interval) + " years ago";
};

interface HistoryListItemProps {
  item: HistoryItem;
  onSelect: (item: HistoryItem) => void;
  onCopy: (password: string) => void;
  onDeleteItem: (timestamp: number) => void;
}

const HistoryListItem: React.FC<HistoryListItemProps> = ({ item, onSelect, onCopy, onDeleteItem }) => {
  const [translateX, setTranslateX] = useState(0);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const wasDragged = useRef(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const DELETE_THRESHOLD = -80;
  const COPY_THRESHOLD = 80;

  const getClientX = (e: MouseEvent | TouchEvent): number => {
    return 'touches' in e ? e.touches[0].clientX : e.clientX;
  };

  const handleDragStart = useCallback((e: MouseEvent | TouchEvent) => {
    isDragging.current = true;
    wasDragged.current = false;
    dragStartX.current = getClientX(e);
    if (itemRef.current) {
      itemRef.current.style.transition = 'none';
      e.stopPropagation();
    }
  }, []);
  
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    e.stopPropagation();

    const currentX = getClientX(e);
    const dragDistance = currentX - dragStartX.current;
    
    if (Math.abs(dragDistance) > 5) { // Threshold to consider it a drag
        wasDragged.current = true;
    }

    setTranslateX(dragDistance);
  }, []);

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.stopPropagation();

    if (itemRef.current) {
      itemRef.current.style.transition = 'transform 0.3s ease';
    }

    if (translateX < DELETE_THRESHOLD) {
      setTranslateX(-itemRef.current!.offsetWidth);
      setTimeout(() => {
        onDeleteItem(item.timestamp);
      }, 300);
    } else if (translateX > COPY_THRESHOLD) {
        onCopy(item.password);
        setTranslateX(0); // Snap back
    } else {
      setTranslateX(0);
    }
  }, [translateX, onDeleteItem, onCopy, item.password, item.timestamp, COPY_THRESHOLD, DELETE_THRESHOLD]);

  const handleSelect = () => {
    if (wasDragged.current) return;
    onSelect(item);
  };

  return (
    <li className="relative bg-slate-800/50 rounded-md">
        <div 
          className="absolute inset-0 bg-red-600 flex items-center justify-end pr-6 pointer-events-none rounded-md" 
          style={{ opacity: Math.min(Math.abs(translateX / DELETE_THRESHOLD), 1) }}
        >
            <TrashIcon className="w-6 h-6 text-white" />
        </div>
        <div 
          className="absolute inset-0 bg-emerald-600 flex items-center justify-start pl-6 pointer-events-none rounded-md" 
          style={{ opacity: Math.min(translateX / COPY_THRESHOLD, 1) }}
        >
            <CopyIcon className="w-6 h-6 text-white" />
        </div>

        <div
            ref={itemRef}
            className="relative flex items-center bg-slate-700/50 group hover:bg-slate-700 transition-colors duration-300 p-3 rounded-md"
            style={{ transform: `translateX(${translateX}px)`, touchAction: 'pan-y' }}
            onMouseDown={handleDragStart as any}
            onTouchStart={handleDragStart as any}
            onMouseMove={handleDragMove as any}
            onTouchMove={handleDragMove as any}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchEnd={handleDragEnd}
        >
            <div 
                className="flex-1 pr-4 cursor-pointer"
                onClick={handleSelect}
            >
                <span className="text-slate-300 break-all font-sans group-hover:text-emerald-400 transition-colors">
                    {item.password}
                </span>
                <p className="text-slate-500 text-xs mt-1">{formatTimeAgo(item.timestamp)}</p>
            </div>
            
            <div className="flex items-center gap-3">
                <Tooltip text="Copy password" align="right">
                  <button onClick={(e) => { e.stopPropagation(); onCopy(item.password); }} aria-label={`Copy password ${item.password}`}>
                      <CopyIcon className="text-emerald-500/70 group-hover:text-white transition-colors w-5 h-5" />
                  </button>
                </Tooltip>
            </div>
        </div>
    </li>
  );
};

const PasswordHistory: React.FC<PasswordHistoryProps> = ({ history, onSelect, onClear, onCopy, onDeleteItem, onExport }) => {

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-slate-400 font-bold text-lg">History</h2>
        {history.length > 0 && (
            <div className="flex items-center gap-4">
                <Tooltip text="Export history as .txt" align="right">
                    <button 
                        onClick={onExport}
                        className="group"
                        aria-label="Export password history"
                    >
                        <ExportIcon />
                    </button>
                </Tooltip>
                <Tooltip text="Clear all history" align="right">
                  <button 
                    onClick={onClear} 
                    className="group"
                    aria-label="Clear password history"
                  >
                    <TrashIcon />
                  </button>
                </Tooltip>
            </div>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {history.length > 0 ? (
          <ul className="space-y-3">
            {history.map((item) => (
              <HistoryListItem
                key={item.timestamp}
                item={item}
                onSelect={onSelect}
                onCopy={onCopy}
                onDeleteItem={onDeleteItem}
              />
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-center py-4">Previously generated passwords will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default PasswordHistory;