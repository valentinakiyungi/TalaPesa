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
  TooltipProps,
} from 'recharts';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';

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

  // Real calculations
  const totalDisbursed = loans
    .filter(l => l.status === 'disbursed' || l.status === 'issued')
    .reduce((sum, l) => sum + (l.principal || 0), 0);

  const totalCollected = loans
    .reduce((sum, l) => {
      const payments = l.payments || [];
      return sum + payments.reduce((pSum: number, p: any) => pSum + (p.amount || 0), 0);
    }, 0);

  const activeLoans = loans.filter(l => l.status === 'active' && (l.balanceDue || 0) > 0).length;

  const overdueLoans = loans.filter(l => {
    if ((l.balanceDue || 0) <= 0) return false;
    const start = l.createdAt?.toDate?.();
    if (!start) return false;
    const due = new Date(start.getTime() + (l.loanDuration || 0) * 30 * 24 * 60 * 60 * 1000);
    return due < new Date();
  }).length;

  const pendingLoans = loans.filter(l => l.status === 'pending').length;

  // Monthly data - group real disbursements and collections by month (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - i);
    const monthName = monthDate.toLocaleString('default', { month: 'short' });

    const disbursedThisMonth = loans
      .filter(l => {
        const created = l.createdAt?.toDate?.();
        return created && created.getMonth() === monthDate.getMonth() && created.getFullYear() === monthDate.getFullYear();
      })
      .reduce((sum, l) => sum + (l.principal || 0), 0);

    const collectedThisMonth = loans
      .reduce((sum, l) => {
        const payments = (l.payments || []).filter((p: any) => {
          const payDate = p.date?.toDate?.();
          return payDate && payDate.getMonth() === monthDate.getMonth() && payDate.getFullYear() === monthDate.getFullYear();
        });
        return sum + payments.reduce((pSum: number, p: any) => pSum + (p.amount || 0), 0);
      }, 0);

    return { month: monthName, disbursed: disbursedThisMonth, collected: collectedThisMonth };
  }).reverse();

  const statusData = [
    { name: 'Active', value: activeLoans, color: '#10b981' },
    { name: 'Pending', value: pendingLoans, color: '#f59e0b' },
    { name: 'Overdue', value: overdueLoans, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `TZS ${isNaN(num) ? 0 : num.toLocaleString()}`;
  };

  const exportReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175);
    doc.text('TalaPesa Business Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('Live Data • February 2026', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Key Statistics', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Total Disbursed: ${formatCurrency(totalDisbursed)}`, 20, yPos);
    yPos += 8;
    doc.text(`Total Collected: ${formatCurrency(totalCollected)}`, 20, yPos);
    yPos += 8;
    doc.text(`Active Loans: ${activeLoans}`, 20, yPos);
    yPos += 8;
    doc.text(`Overdue Loans: ${overdueLoans}`, 20, yPos);
    yPos += 20;

    doc.setFontSize(16);
    doc.text('Loan Status Summary', 20, yPos);
    yPos += 10;

    statusData.forEach((item) => {
      doc.setFontSize(12);
      doc.text(`${item.name}: ${item.value} loans`, 20, yPos);
      yPos += 8;
    });

    yPos += 10;

    doc.setFontSize(16);
    doc.text('Disbursed vs Collected (Last 6 Months)', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    monthlyData.forEach((m) => {
      doc.text(`${m.month}: Disbursed ${formatCurrency(m.disbursed)} | Collected ${formatCurrency(m.collected)}`, 20, yPos);
      yPos += 8;
    });

    const today = new Date().toLocaleDateString('en-GB');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${today}`, pageWidth - 20, 290, { align: 'right' });

    doc.save(`TalaPesa_Report_${today.replace(/\//g, '-')}.pdf`);
  };

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
          <p className="text-xl text-gray-600">Live Data • February 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-lg font-medium">Total Disbursed</p>
                <p className="text-5xl font-bold mt-3">{formatCurrency(totalDisbursed)}</p>
              </div>
              <TrendingUp size={56} className="opacity-90" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-lg font-medium">Total Collected</p>
                <p className="text-5xl font-bold mt-3">{formatCurrency(totalCollected)}</p>
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
                <YAxis tickFormatter={(v) => `${(Number(v) / 1000000).toFixed(1)}M`} stroke="#6b7280" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
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
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} loans`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-center py-10">
          <button
            onClick={exportReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition transform hover:scale-105 flex items-center gap-4 mx-auto"
          >
            <Download size={32} /> Export Report
          </button>
        </div>
      </div>
    </div>
  );
}