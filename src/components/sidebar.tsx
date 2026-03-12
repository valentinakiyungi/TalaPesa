'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="sm:hidden fixed top-4 left-4 z-50 bg-blue-900 text-white p-2 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-screen w-56 bg-gradient-to-b from-blue-900 to-indigo-950 text-white overflow-y-auto transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 sm:relative sm:top-0 sm:left-0`}
      >
        <div className="p-5 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-10 text-center">TalaPesa</h2>

          <nav className="space-y-1 flex-grow">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-base font-medium ${
                pathname === '/dashboard' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-gray-200'
              }`}
            >
              <Home size={20} />
              Dashboard
            </Link>

            <Link
              href="/loans"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-base font-medium ${
                pathname === '/loans' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-gray-200'
              }`}
            >
              <FileText size={20} />
              All Loans
            </Link>

            <Link
              href="/loans/create"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-base font-medium ${
                pathname === '/loans/create' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-gray-200'
              }`}
            >
              <Plus size={20} />
              Create a Loan
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-base font-medium ${
                pathname === '/settings' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-gray-200'
              }`}
            >
              <Settings size={20} />
              Settings
            </Link>
          </nav>

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

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 sm:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}