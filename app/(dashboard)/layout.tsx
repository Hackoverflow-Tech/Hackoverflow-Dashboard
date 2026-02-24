'use client';

import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff'
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {children}
      </main>
    </div>
  );
}