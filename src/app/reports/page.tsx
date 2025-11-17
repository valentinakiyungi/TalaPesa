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
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

export default function ReportsPage() {
  const stats = {
    totalRevenue: 48200000,
    totalCollected: 38900000,
    totalPending: 9300000,
    totalOverdue: 4200000,
    activeLoans: 142,
    newLoansThisMonth: 28,
  };

  const monthlyData = [
    { month: 'Jan', revenue: 3200000, collected: 2800000 },
    { month: 'Feb', revenue: 3800000, collected: 3400000 },
    { month: 'Mar', revenue: 4200000, collected: 3900000 },
    { month: 'Apr', revenue: 4800000, collected: 4100000 },
    { month: 'May', revenue: 5200000, collected: 4500000 },
    { month: 'Jun', revenue: 5800000, collected: 5200000 },
  ];

  const statusData = [
    { name: 'Active', value: 120, color: '#10b981' },
    { name: 'Pending', value: 22, color: '#f59e0b' },
    { name: 'Overdue', value: 8, color: '#ef4444' },
  ];

  const growthData = [
    { month: 'Jan', newLoans: 18 },
    { month: 'Feb', newLoans: 22 },
    { month: 'Mar', newLoans: 25 },
    { month: 'Apr', newLoans: 28 },
    { month: 'May', newLoans: 30 },
    { month: 'Jun', newLoans: 32 },
  ];

  // Safe formatter for Recharts Tooltip
  const formatCurrency = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? value : `TZS ${num.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 text-lg font-medium"
        >
          <ArrowLeft size={22} /> Back to Dashboard
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            <FileText className="inline-block mr-4 text-blue-600" size={48} />
            Business Reports
          </h1>
          <p className="text-xl text-gray-600">November 2025 • Full Financial Overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-lg font-medium">Total Revenue</p>
                <p className="text-5xl font-bold mt-3">
                  TZS {(stats.totalRevenue / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp size={56} className="opacity-90" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-lg font-medium">Collected</p>
                <p className="text-5xl font-bold mt-3">
                  TZS {(stats.totalCollected / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign size={56} className="opacity-90" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-lg font-medium">Pending</p>
                <p className="text-5xl font-bold mt-3">
                  TZS {(stats.totalPending / 1000000).toFixed(1)}M
                </p>
              </div>
              <Calendar size={56} className="opacity-90" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-lg font-medium">Overdue</p>
                <p className="text-5xl font-bold mt-3">
                  TZS {(stats.totalOverdue / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingDown size={56} className="opacity-90" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Revenue vs Collection</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} stroke="#6b7280" />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={5} dot={{ r: 8 }} />
                <Line type="monotone" dataKey="collected" stroke="#10b981" name="Collected" strokeWidth={5} dot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Loan Status Distribution</h2>
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

        <div className="bg-white p-8 rounded-2xl shadow-xl mb-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">New Loans Growth (2025)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(v) => `${v} new loans`} />
              <Bar dataKey="newLoans" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Export Buttons */}
        <div className="text-center pb-10">
          <div className="flex flex-wrap justify-center gap-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition transform hover:scale-105 flex items-center gap-4">
              <Download size={32} /> Export PDF
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition transform hover:scale-105 flex items-center gap-4">
              <Download size={32} /> Export Excel
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition transform hover:scale-105 flex items-center gap-4">
              <Download size={32} /> Send to WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
