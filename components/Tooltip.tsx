'use client';

import { useEffect, useRef, useState } from 'react';

interface TooltipProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position: { x: number; y: number };
}

export default function Tooltip({ isOpen, onClose, children, position }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (isOpen && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = position.x;
      let newY = position.y;
      let transform = 'translate(-50%, -100%)';
      
      // Adjust horizontal position if tooltip goes off screen
      if (position.x - rect.width / 2 < 10) {
        // Too far left - align to left edge
        newX = 10 + rect.width / 2;
      } else if (position.x + rect.width / 2 > viewportWidth - 10) {
        // Too far right - align to right edge
        newX = viewportWidth - 10 - rect.width / 2;
      }
      
      // Adjust vertical position if tooltip goes off top of screen
      if (position.y - rect.height - 8 < 10) {
        // Show below instead of above
        newY = position.y + 20;
        transform = 'translate(-50%, 0%)';
      }
      
      setAdjustedPosition({ x: newX, y: newY });
      tooltip.style.transform = transform;
    }
  }, [isOpen, position]);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-dark-surface border border-dark-border rounded-lg shadow-xl p-3 max-w-xs"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      {/* Arrow pointing down */}
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-border"
        style={{ marginTop: '-1px' }}
      />
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"
        style={{ marginTop: '0px' }}
      />
      
      {children}
    </div>
  );
}
