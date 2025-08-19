'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import speakLogoLight from '@/app/assets/speak_logo_lightmode.svg';
import speakLogoDark from '@/app/assets/speak_logo_darkmode.svg';

export default function Navigation() {
  const { user, logout } = useAuth();
  const ds = useDesignSystem();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-gray-200 dark:border-dark-border" style={{
      backgroundColor: ds.resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(22, 27, 34, 0.9)',
      position: 'sticky',
      top: '0',
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src={ds.resolvedTheme === 'light' ? speakLogoLight.src : speakLogoDark.src} 
              alt="Speak Logo" 
              className="h-8 w-auto"
            />
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            
            <div className="flex items-center space-x-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: ds.button.primary.bg }}>
                  <User size={16} style={{ color: ds.button.primary.text }} />
                </div>
              )}
              <div className="text-sm">
                <p className="font-medium" style={{ color: ds.text.primary }}>{user.name}</p>
                <p style={{ color: ds.text.secondary }}>
                  {user.role === 'admin' ? '管理者' : user.id}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 transition-colors rounded-lg"
              style={{ color: ds.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = ds.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = ds.text.secondary}
              title="ログアウト"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
