'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AuthGuard from '@/components/AuthGuard';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRole="DOCTOR">
      <div className="flex flex-col h-screen bg-slate-50">
        {/* Header */}
        <Header />

        {/* Main Content with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar role="doctor" />
          
          <main className="flex-1 overflow-y-auto lg:ml-0">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
