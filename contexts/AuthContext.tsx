'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types';
import { mockUsers } from '@/lib/mock-data';

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
      if (id === 'admin' && password === 'admin123') {
        console.log('✅ Admin login detected');
        const adminUser: User = {
          id: 'admin',
          name: 'スピークチーム',
          email: 'admin@usespeak.com',
          role: 'admin'
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
           console.log('⚠️ Google Sheets not configured, falling back to mock data');
           // Fallback to mock authentication when Google Sheets isn't configured
           console.log('🔍 Available mock users:', mockUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
           console.log('🔍 Looking for user with ID:', id);
           const user = mockUsers.find(u => u.id === id || u.email === id);
           console.log('🔍 Found user in mock data:', user);
           console.log('🔍 User lookup details:', { 
             searchedId: id, 
             foundById: mockUsers.find(u => u.id === id),
             foundByEmail: mockUsers.find(u => u.email === id)
           });
          console.log('🔑 Password check:', { provided: password, expected: 'password', match: password === 'password' });
          
          if (user && password === 'password') {
            console.log('✅ Mock authentication successful');
            setAuthState({
              user,
              isAuthenticated: true,
            });
            localStorage.setItem('auth-user', JSON.stringify(user));
            return true;
          } else {
            console.log('❌ Mock authentication failed - user not found or password mismatch');
          }
        }
      }
      
      // Fallback to mock authentication for development
      console.log('🔄 Trying mock authentication fallback...');
      console.log('🔍 Available mock users:', mockUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
      console.log('🔍 Looking for user with ID:', id);
      const user = mockUsers.find(u => u.id === id || u.email === id);
      console.log('🔍 Found user in mock data:', user);
      console.log('🔍 User lookup details:', { 
        searchedId: id, 
        foundById: mockUsers.find(u => u.id === id),
        foundByEmail: mockUsers.find(u => u.email === id)
      });
      console.log('🔑 Password check:', { provided: password, expected: 'password', match: password === 'password' });
      
      if (user && password === 'password') {
        console.log('✅ Mock fallback authentication successful');
        setAuthState({
          user,
          isAuthenticated: true,
        });
        localStorage.setItem('auth-user', JSON.stringify(user));
        return true;
      } else {
        console.log('❌ Mock fallback authentication failed - user not found or password mismatch');
      }
      
      console.log('❌ All authentication methods failed');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      console.log('🔄 Trying final mock authentication fallback due to error...');
      
      // Fallback to mock authentication
      console.log('🔍 Available mock users:', mockUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
      const user = mockUsers.find(u => u.id === id || u.email === id);
      console.log('🔍 Found user in mock data:', user);
      console.log('🔑 Password check:', { provided: password, expected: 'password', match: password === 'password' });
      
      if (user && password === 'password') {
        console.log('✅ Final mock fallback authentication successful');
        setAuthState({
          user,
          isAuthenticated: true,
        });
        localStorage.setItem('auth-user', JSON.stringify(user));
        return true;
      } else {
        console.log('❌ Final mock fallback authentication failed');
      }
      
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
