'use client';

import Navigation from '@/components/Navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">{children}</main>
    </div>
  );
}
