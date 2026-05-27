'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AIPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/patient/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600">Redirecting to Patient Dashboard...</p>
      </div>
    </div>
  );
}
