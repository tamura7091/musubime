'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-dark-bg">
        <Navigation />
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}
