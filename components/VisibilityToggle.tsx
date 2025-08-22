import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useDesignSystem } from '../hooks/useDesignSystem';
import { useAmountVisibility } from '../contexts/AmountVisibilityContext';

interface VisibilityToggleProps {
  children: React.ReactNode;
  className?: string;
  showToggleButton?: boolean;
}

export default function VisibilityToggle({ children, className = '', showToggleButton = true }: VisibilityToggleProps) {
  const { isVisible, toggleVisibility } = useAmountVisibility();
  const ds = useDesignSystem();

  const displayContent = isVisible ? children : '¥*****';

  if (!showToggleButton) {
    return <span className={className}>{displayContent}</span>;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span>{displayContent}</span>
      <button
        onClick={toggleVisibility}
        className="p-1 rounded transition-colors"
        style={{
          backgroundColor: isVisible ? ds.button.secondary.bg : ds.button.primary.bg,
          color: isVisible ? ds.button.secondary.text : ds.button.primary.text
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isVisible 
            ? ds.button.secondary.hover 
            : ds.button.primary.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isVisible 
            ? ds.button.secondary.bg 
            : ds.button.primary.bg;
        }}
        title={isVisible ? '金額を隠す' : '金額を表示'}
      >
        {isVisible ? (
          <Eye size={16} />
        ) : (
          <EyeOff size={16} />
        )}
      </button>
    </div>
  );
}
