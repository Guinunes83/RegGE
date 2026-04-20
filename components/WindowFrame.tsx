
import React, { useState, useEffect, useRef } from 'react';

interface WindowFrameProps {
  id: string;
  title: string;
  isActive: boolean;
  zIndex: number;
  onClose: () => void;
  onFocus: () => void;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  id,
  title,
  isActive,
  zIndex,
  onClose,
  onFocus,
  children,
  initialPosition = { x: 50, y: 50 },
  initialSize = { width: 900, height: 600 }
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Random offset for new windows to cascade them
  useEffect(() => {
    if (initialPosition.x === 50 && initialPosition.y === 50) {
      const randomOffset = Math.floor(Math.random() * 40);
      setPosition({ x: 50 + randomOffset, y: 50 + randomOffset });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    if (windowRef.current) {
      setIsDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      onFocus();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ 
          x: e.clientX - dragOffset.x, 
          y: e.clientY - dragOffset.y 
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={windowRef}
      onMouseDown={onFocus}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: zIndex,
        width: initialSize.width,
        maxHeight: '85vh', // Prevent window from being taller than viewport
      }}
      className={`
        bg-white shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-gray-300 rounded-lg overflow-hidden flex flex-col
        transition-shadow duration-200
        ${isActive ? 'shadow-[0_20px_60px_rgba(0,123,99,0.3)] border-[#007b63]/50' : 'opacity-95'}
      `}
    >
      {/* Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          h-10 px-4 flex items-center justify-between cursor-grab active:cursor-grabbing select-none shrink-0
          ${isActive ? 'bg-[#007b63] text-white' : 'bg-gray-200 text-gray-600'}
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden">
           <span className="text-sm font-bold uppercase tracking-wide truncate">{title}</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className={`
            p-1 rounded-md transition-colors duration-200 flex items-center justify-center
            ${isActive 
              ? 'hover:bg-white/20 text-white/80 hover:text-white' 
              : 'hover:bg-gray-300 text-gray-500 hover:text-red-600'}
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar p-1 relative">
         {children}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};
