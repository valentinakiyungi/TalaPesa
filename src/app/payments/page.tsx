'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function PaymentsPage() {
  const payments = [
    { id: '1', customer: 'John Doe', amount: 'TZS 150,000', date: '2025-04-05', status: 'paid' },
    { id: '2', customer: 'Amina Hassan', amount: 'TZS 200,000', date: '2025-04-04', status: 'pending' },
    { id: '3', customer: 'Fatima Ali', amount: 'TZS 180,000', date: '2025-04-03', status: 'overdue' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="text-green-600" size={20} />;
      case 'pending': return <Clock className="text-yellow-600" size={20} />;
      case 'overdue': return <AlertCircle className="text-red-600" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">All Payments</h1>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-4 text-left">Customer</th>
                  <th className="py-4 text-left">Amount</th>
                  <th className="py-4 text-left">Date</th>
                  <th className="py-4 text-left">Status</th>
                  <th className="py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-5 font-semibold">{p.customer}</td>
                    <td className="py-5 text-lg font-bold text-blue-600">{p.amount}</td>
                    <td className="py-5">{p.date}</td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(p.status)}
                        <span className={
                          p.status === 'paid' ? 'status-paid' :
                          p.status === 'pending' ? 'status-pending' : 'status-overdue'
                        }>
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-5">
                      <button className="btn btn-primary btn-sm">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}