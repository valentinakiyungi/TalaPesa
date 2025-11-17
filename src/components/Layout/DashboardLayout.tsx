'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Receipt,
  PiggyBank
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/loans/create', label: 'Create Loan', icon: DollarSign },
  { href: '/loans', label: 'All Loans', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: FileText },
  { href: '/expenses', label: 'Expenses', icon: PiggyBank },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/staff', label: 'Staff', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-blue-700 text-white p-3 rounded-xl shadow-2xl hover:bg-blue-800 transition"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-blue-900 to-indigo-950 text-white transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-8 border-b border-blue-800">
            <h1 className="text-3xl font-bold text-white">Mkopo wa Haraka Tanzania</h1>
            <p className="text-blue-200 text-sm mt-1">Cash Loan System</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 font-medium text-lg ${
                    isActive
                      ? 'bg-white text-blue-900 shadow-lg font-bold'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon size={24} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-6 border-t border-blue-800">
            <button className="flex items-center gap-4 px-6 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white w-full transition font-semibold text-lg shadow-lg">
              <LogOut size={24} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        <div className="p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
