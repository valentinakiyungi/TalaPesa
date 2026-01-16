'use client';

import './globals.css';
import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import QueryProvider from '@/app/_providers/QueryProvider';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <html lang="sw">
        <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-20 h-20 animate-spin text-blue-600 mx-auto mb-6" />
            <p className="text-2xl text-gray-700">Inapakia TalaPesa...</p>
          </div>
        </body>
      </html>
    );
  }

  const isAuthPage = typeof window !== 'undefined' && 
    ['/login', '/register'].includes(window.location.pathname);

  if (isAuthPage || !user) {
    return (
      <html lang="sw">
        <body><QueryProvider>{children}</QueryProvider></body>
      </html>
    );
  }

  return (
    <html lang="sw">
      <body className="bg-gray-50 flex min-h-screen">
        <QueryProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
