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

  const displayContent = isVisible ? children : (
    <span style={{ color: ds.text.secondary }}>¥*****</span>
  );

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
          backgroundColor: 'transparent',
          color: ds.text.secondary
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = ds.text.primary;
          e.currentTarget.style.backgroundColor = ds.bg.surface + '50';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = ds.text.secondary;
          e.currentTarget.style.backgroundColor = 'transparent';
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
