'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LayoutDashboard, FileText, LogOut, PlusCircle } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const menu = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/loans', label: 'Mikopo Yote', icon: FileText },
    { href: '/loans/create', label: 'Sajili Mkopo', icon: PlusCircle },
  ];

  return (
    <div className="w-72 bg-gradient-to-b from-blue-800 to-indigo-900 text-white min-h-screen p-6 flex flex-col">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">TalaPesa</h1>
        <p className="text-blue-200 text-sm mt-2">Mkopo wa Haraka</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-6 py-4 rounded-xl hover:bg-white/20 transition text-lg font-medium"
            >
              <Icon size={24} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-4 px-6 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition font-bold text-lg shadow-lg mt-auto"
      >
        <LogOut size={24} />
        Logout
      </button>
    </div>
  );
}
