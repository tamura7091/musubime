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
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16">{children}</main>
      </div>
    </AuthProvider>
  );
}
