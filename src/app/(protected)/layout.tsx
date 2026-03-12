'use client';

import Sidebar from '@/components/sidebar'; // adjust path if needed

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-56 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}