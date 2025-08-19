'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useDesignSystem } from '@/hooks/useDesignSystem';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const ds = useDesignSystem();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor size={18} />;
    }
    return theme === 'light' ? <Sun size={18} /> : <Moon size={18} />;
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg transition-colors"
      style={{
        color: ds.text.secondary,
        backgroundColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = ds.text.primary;
        e.currentTarget.style.backgroundColor = ds.bg.surface + '50';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = ds.text.secondary;
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      aria-label="テーマを切り替え"
      title={`現在のテーマ: ${theme === 'light' ? 'ライト' : theme === 'dark' ? 'ダーク' : 'システム'}`}
    >
      {getThemeIcon()}
    </button>
  );
}
