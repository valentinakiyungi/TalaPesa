
'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ReportsPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'loans'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLoans(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalDisbursed = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalCollected = loans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
  const activeLoans = loans.filter(l => l.status !== 'paid' && l.status !== 'overdue').length;
  const overdueLoans = loans.filter(l => l.status === 'overdue').length;

  const monthlyData = [
    { month: 'Jan', disbursed: 3200000, collected: 2800000 },
    { month: 'Feb', disbursed: 3800000, collected: 3400000 },
    { month: 'Mar', disbursed: 4200000, collected: 3900000 },
    { month: 'Apr', disbursed: 4800000, collected: 4100000 },
    { month: 'May', disbursed: 5200000, collected: 4500000 },
    { month: 'Jun', disbursed: 5800000, collected: 5200000 },
  ];

  const statusData = [
    { name: 'Active', value: activeLoans || 1, color: '#10b981' },
    { name: 'Pending', value: loans.filter(l => l.status === 'pending').length || 1, color: '#f59e0b' },
    { name: 'Overdue', value: overdueLoans || 1, color: '#ef4444' },
  ];

  const formatCurrency = (value: any) => `TZS ${Number(value).toLocaleString()}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-20 h-20 animate-spin text-blue-600 mx-auto mb-8" />
          <p className="text-3xl text-gray-700">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 text-lg font-medium">
          <ArrowLeft size={22} /> Back to Dashboard
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            <FileText className="inline-block mr-4 text-blue-600" size={48} />
            Business Reports
          </h1>
          <p className="text-xl text-gray-600">Live Data • November 2025</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-lg font-medium">Total Disbursed</p>
                <p className="text-5xl font-bold mt-3">TZS {(totalDisbursed / 1000000).toFixed(1)}M</p>
              </div>
              <TrendingUp size={56} className="opacity-90" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-lg font-medium">Total Collected</p>
                <p className="text-5xl font-bold mt-3">TZS {(totalCollected / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign size={56} className="opacity-90" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-lg font-medium">Active Loans</p>
                <p className="text-5xl font-bold mt-3">{activeLoans}</p>
              </div>
              <Calendar size={56} className="opacity-90" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-lg font-medium">Overdue</p>
                <p className="text-5xl font-bold mt-3">{overdueLoans}</p>
              </div>
              <TrendingDown size={56} className="opacity-90" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Disbursed vs Collected</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} stroke="#6b7280" />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Line type="monotone" dataKey="disbursed" stroke="#3b82f6" name="Disbursed" strokeWidth={5} dot={{ r: 8 }} />
                <Line type="monotone" dataKey="collected" stroke="#10b981" name="Collected" strokeWidth={5} dot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Loan Status</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={130}
                  paddingAngle={6}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} loans`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-center py-10">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition transform hover:scale-105 flex items-center gap-4 mx-auto">
            <Download size={32} /> Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
