'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, FileText, TrendingUp, Calendar, AlertCircle, Plus, Loader2 } from 'lucide-react';

async function fetchDashboardStats() {
  const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 text-xl">Error loading data. Please try again.</p>
      </div>
    );
  }

  const collectionRate = stats?.totalDisbursed > 0
    ? Math.round((stats.totalCollected / stats.totalDisbursed) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-16 lg:pb-8">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-2">
          Welcome Back!
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 font-medium">
          TalaPesa • Mkopo wa Haraka Tanzania
        </p>
        <p className="text-base sm:text-lg text-gray-500 mt-2">
          {new Date().toLocaleDateString('sw-TZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm sm:text-lg font-medium">Total Loans</p>
              <p className="text-4xl sm:text-5xl font-bold mt-2">{stats?.totalLoans || 0}</p>
            </div>
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm sm:text-lg font-medium">Total Collected</p>
              <p className="text-4xl sm:text-5xl font-bold mt-2">
                TZS {(stats?.totalCollected / 1000000 || 0).toFixed(1)}M
              </p>
            </div>
            <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm sm:text-lg font-medium">Today&apos;s Collections</p>
              <p className="text-4xl sm:text-5xl font-bold mt-2">
                TZS {(stats?.todayCollections / 1000000 || 0).toFixed(2)}M
              </p>
            </div>
            <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm sm:text-lg font-medium">Active Loans</p>
              <p className="text-4xl sm:text-5xl font-bold mt-2">{stats?.activeLoans || 0}</p>
            </div>
            <Users className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm sm:text-lg font-medium">Overdue</p>
              <p className="text-4xl sm:text-5xl font-bold mt-2">{stats?.overdueLoans || 0}</p>
            </div>
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm sm:text-lg font-medium">Collection Rate</p>
              <p className="text-4xl sm:text-5xl font-bold mt-2">{collectionRate}%</p>
            </div>
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-8">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link href="/loans/create" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg sm:text-xl px-8 py-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex flex-col items-center gap-4">
            <Plus className="w-12 h-12" />
            <span>Create New Loan</span>
          </Link>
          <Link href="/customers/new" className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold text-lg sm:text-xl px-8 py-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex flex-col items-center gap-4">
            <Users className="w-12 h-12" />
            <span>Add Customer</span>
          </Link>
          <Link href="/reports" className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-lg sm:text-xl px-8 py-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex flex-col items-center gap-4">
            <FileText className="w-12 h-12" />
            <span>View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
