'use client';

import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface Loan {
  id: string;
  principal?: number;
  balanceDue?: number;
  totalAmount?: number;
  status?: string;
  createdAt?: any; // Firebase Timestamp
  customerName?: string;
  loanDuration?: number;
  nextDueDate?: any;     // Added for today's collection check
  dueDate?: any;         // Added as fallback
}

export default function Dashboard() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalDisbursed: 0,
    totalCollected: 0,
    overdueLoans: 0,
    todayCollections: 0,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      collection(db, 'loans'),
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Loan[];

        let totalDisbursed = 0;
        let totalCollected = 0;
        let activeLoans = 0;
        let overdueLoans = 0;
        let todayCollections = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        data.forEach((loan) => {
          if (loan.status === 'disbursed' || loan.status === 'issued') {
            totalDisbursed += Number(loan.principal || 0);
          }

          totalCollected += Number((loan.totalAmount || 0) - (loan.balanceDue || 0));

          if (loan.status === 'active' && (loan.balanceDue || 0) > 0) {
            activeLoans++;
          }

          const startDate = loan.createdAt?.toDate?.();
          if (startDate && (loan.balanceDue || 0) > 0) {
            const dueDate = new Date(startDate.getTime() + (loan.loanDuration || 0) * 30 * 24 * 60 * 60 * 1000);
            if (dueDate < today) overdueLoans++;
          }

          const due = loan.nextDueDate?.toDate?.() || loan.dueDate?.toDate?.();
          if (due && new Date(due).toDateString() === today.toDateString()) {
            todayCollections += Number(loan.balanceDue || 0);
          }
        });

        setStats({
          totalLoans: data.length,
          activeLoans,
          totalDisbursed,
          totalCollected,
          overdueLoans,
          todayCollections,
        });

        setLoans(data);
        setLoading(false);
      },
      (err) => {
        console.error('Dashboard fetch error:', err);
        setError('Hitilafu wakati wa kupakia data ya dashboard.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const formatMoney = (num: number) => `TZS ${num.toLocaleString()}`;

  const collectionRate = stats.totalDisbursed > 0
    ? Math.round((stats.totalCollected / stats.totalDisbursed) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
          <p className="text-2xl text-gray-700">Inapakia dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
          <p className="text-2xl text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xl font-bold transition"
          >
            Jaribu Tena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 lg:pb-8 px-4 sm:px-6 lg:px-8 sm:ml-56">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-2">
          Karibu!
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 font-medium">
          TalaPesa • Mkopo wa Haraka Tanzania
        </p>
        <p className="text-base sm:text-lg text-gray-500 mt-2">
          {new Date().toLocaleDateString('sw-TZ', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <Link href="/loans/issued" className="block">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm sm:text-lg font-medium truncate">
                  Total Loans Issued
                </p>
                <p className="text-2xl sm:text-4xl md:text-5xl font-bold mt-2 truncate">
                  {stats.totalLoans}
                </p>
              </div>
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
            </div>
          </div>
        </Link>

        <Link href="/loans/collected" className="block">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm sm:text-lg font-medium">Total Collected</p>
                <p className="text-4xl sm:text-5xl font-bold mt-2">{formatMoney(stats.totalCollected)}</p>
              </div>
              <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
            </div>
          </div>
        </Link>

        <Link href="/loans/today-collections" className="block">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm sm:text-lg font-medium">Today's Collections</p>
                <p className="text-4xl sm:text-5xl font-bold mt-2">{formatMoney(stats.todayCollections)}</p>
              </div>
              <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
            </div>
          </div>
        </Link>

        <Link href="/loans/active" className="block">
          <div className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm sm:text-lg font-medium">Active Loans</p>
                <p className="text-4xl sm:text-5xl font-bold mt-2">{stats.activeLoans}</p>
              </div>
              <Users className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
            </div>
          </div>
        </Link>

        <Link href="/loans/overdue" className="block">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm sm:text-lg font-medium">Overdue Loans</p>
                <p className="text-4xl sm:text-5xl font-bold mt-2">{stats.overdueLoans}</p>
              </div>
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
            </div>
          </div>
        </Link>

        <Link href="/reports" className="block">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm sm:text-lg font-medium">Collection Rate</p>
                <p className="text-4xl sm:text-5xl font-bold mt-2">{collectionRate}%</p>
              </div>
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-8">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link
            href="/loans/create"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg sm:text-xl px-8 py-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2 flex flex-col items-center gap-4"
          >
            <Plus className="w-12 h-12" />
            <span>Create New Loan</span>
          </Link>

          <Link
            href="/loans"
            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-lg sm:text-xl px-8 py-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2 flex flex-col items-center gap-4"
          >
            <FileText className="w-12 h-12" />
            <span>View All Loans</span>
          </Link>

          <Link
            href="/reports"
            className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-lg sm:text-xl px-8 py-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2 flex flex-col items-center gap-4"
          >
            <TrendingUp className="w-12 h-12" />
            <span>View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}