'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, FileText, Settings, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Optional: clear any custom cookie if you were using one
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Force redirect and refresh to clear stale state
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <aside className="w-56 bg-gradient-to-b from-blue-900 to-indigo-950 text-white h-screen fixed left-0 top-0 overflow-y-auto transition-all duration-300">
      <div className="p-5 flex flex-col h-full">
        {/* Logo / Title */}
        <h2 className="text-2xl font-bold mb-10 text-center">TalaPesa</h2>

        {/* Main Navigation */}
        <nav className="space-y-1 flex-grow">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-base font-medium ${
              pathname === '/dashboard'
                ? 'bg-white/15 text-white'
                : 'hover:bg-white/10 text-gray-200'
            }`}
          >
            <Home size={20} />
            Dashboard
          </Link>

          <Link
            href="/loans"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-base font-medium ${
              pathname === '/loans'
                ? 'bg-white/15 text-white'
                : 'hover:bg-white/10 text-gray-200'
            }`}
          >
            <FileText size={20} />
            All Loans
          </Link>

          <Link
            href="/loans/create"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-base font-medium ${
              pathname === '/loans/create'
                ? 'bg-white/15 text-white'
                : 'hover:bg-white/10 text-gray-200'
            }`}
          >
            <Plus size={20} />
            Create a Loan
          </Link>

          {/* Settings link */}
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-base font-medium ${
              pathname === '/settings'
                ? 'bg-white/15 text-white'
                : 'hover:bg-white/10 text-gray-200'
            }`}
          >
            <Settings size={20} />
            Settings
          </Link>
        </nav>

        {/* Logout - red, at bottom */}
        <div className="mt-auto pt-6 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600/90 hover:bg-red-700 text-white text-base font-medium w-full transition-colors duration-200"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}