'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, LogOut, Menu, X } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import speakLogoLight from '@/app/assets/speak_logo_lightmode.svg';
import speakLogoDark from '@/app/assets/speak_logo_darkmode.svg';
import speakAppLogoPng from '@/app/assets/speak app logo.png';
import { useState } from 'react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const ds = useDesignSystem();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!user) return null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md ${ds.resolvedTheme === 'dark' ? 'border-b border-dark-border' : ''}`} style={{
      backgroundColor: ds.resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(22, 27, 34, 0.9)',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src={ds.resolvedTheme === 'light' ? speakLogoLight.src : speakLogoDark.src} 
              alt="Musubime Logo" 
              className="h-8 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-4">
            <ThemeSwitcher />
            
            <div className="flex items-center space-x-3">
              {(() => {
                const avatarSrc = user.avatar || (user.role === 'admin' ? speakAppLogoPng.src : '');
                if (avatarSrc) {
                  return (
                    <img
                      src={avatarSrc}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  );
                }
                return (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: ds.button.primary.bg }}>
                    <User size={16} style={{ color: ds.button.primary.text }} />
                  </div>
                );
              })()}
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

          {/* Mobile Navigation */}
          <div className="flex sm:hidden items-center space-x-2">
            <ThemeSwitcher />
            <button
              onClick={toggleMenu}
              className="p-2 transition-colors rounded-lg"
              style={{ color: ds.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = ds.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = ds.text.secondary}
              title="メニュー"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="sm:hidden border-t" style={{ borderColor: ds.border.secondary }}>
            <div className="px-4 py-3 space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                {(() => {
                  const avatarSrc = user.avatar || (user.role === 'admin' ? speakAppLogoPng.src : '');
                  if (avatarSrc) {
                    return (
                      <img
                        src={avatarSrc}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    );
                  }
                  return (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: ds.button.primary.bg }}>
                      <User size={20} style={{ color: ds.button.primary.text }} />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <p className="font-medium" style={{ color: ds.text.primary }}>{user.name}</p>
                  <p className="text-sm" style={{ color: ds.text.secondary }}>
                    {user.role === 'admin' ? '管理者' : user.id}
                  </p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: ds.button.secondary.bg,
                  color: ds.button.secondary.text
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ds.button.secondary.bg}
              >
                <LogOut size={16} />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
