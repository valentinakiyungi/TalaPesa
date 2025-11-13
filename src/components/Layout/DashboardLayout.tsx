
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  UserCog,
  UserCheck,
  FilePlus,   // NEW
  LogOut,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/loans', label: 'Loans', icon: DollarSign },
    { href: '/loans/create', label: 'Create Loan', icon: FilePlus }, // NEW
    { href: '/payments', label: 'Payments', icon: FileText },
    { href: '/expenses', label: 'Expenses', icon: FileText },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/staff', label: 'Staff', icon: UserCog },
    { href: '/staff/approval', label: 'Approve Staff', icon: UserCheck },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loggingOut) return;

    setLoggingOut(true);
    localStorage.removeItem('user');

    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch {
      router.push('/auth/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 btn btn-circle btn-primary"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-base-300 text-base-content shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 text-xl font-bold border-b border-base-200 text-center">
          Cash Loan System
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  active
                    ? 'bg-primary text-white shadow-md'
                    : 'hover:bg-base-200 text-base-content/80'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <form onSubmit={handleLogout} className="p-4 border-t border-base-200">
          <button
            type="submit"
            disabled={loggingOut}
            className={`flex items-center gap-2 w-full p-3 rounded-lg transition-all ${
              loggingOut
                ? 'bg-error/70 text-white cursor-not-allowed'
                : 'bg-error text-white hover:bg-red-700'
            }`}
          >
            <LogOut size={18} />
            <span className="font-medium">
              {loggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </form>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}