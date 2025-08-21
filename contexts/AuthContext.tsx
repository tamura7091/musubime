'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types';
import speakAppLogoPng from '@/app/assets/speak app logo.png';

interface AuthContextType extends AuthState {
  login: (id: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for stored auth state
    const storedUser = localStorage.getItem('auth-user');
    if (storedUser) {
      setAuthState({
        user: JSON.parse(storedUser),
        isAuthenticated: true,
      });
    }
  }, []);

  const login = async (id: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthContext login called with ID:', id);
    console.log('🔑 Password provided:', password ? 'Yes' : 'No');
    console.log('📝 Password length:', password?.length || 0);
    
    try {
      // Check if admin login
      if (id === 'teammanji' && password === 'shibuya109') {
        console.log('✅ Admin login detected');
        const adminUser: User = {
          id: 'admin',
          name: 'スピークチーム',
          email: 'admin@usespeak.com',
          role: 'admin',
          avatar: speakAppLogoPng.src
        };
        setAuthState({
          user: adminUser,
          isAuthenticated: true,
        });
        localStorage.setItem('auth-user', JSON.stringify(adminUser));
        return true;
      }

      // Try Google Sheets authentication via API
      console.log('📊 Attempting API authentication...');
      console.log('📤 Sending request to /api/auth/login with:', { id, password: password ? '***' : 'undefined' });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ API authentication successful');
        console.log('👤 User data received:', userData);
        setAuthState({
          user: userData,
          isAuthenticated: true,
        });
        localStorage.setItem('auth-user', JSON.stringify(userData));
        return true;
      } else {
        const errorData = await response.text();
        console.log('❌ API authentication failed');
        console.log('📄 Error response body:', errorData);
        
        if (response.status === 503) {
          console.log('⚠️ Google Sheets not configured');
        }
      }
      
      // No mock fallback
      
      console.log('❌ All authentication methods failed');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      console.log('🔄 Trying final mock authentication fallback due to error...');
      
      // No mock fallback
      
      return false;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('auth-user');
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
