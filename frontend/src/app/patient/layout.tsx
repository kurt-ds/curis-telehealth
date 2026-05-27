'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <Header />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="patient" />
        
        <main className="flex-1 overflow-y-auto lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}
