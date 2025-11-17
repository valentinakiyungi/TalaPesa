'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LoansPage() {
  const payments = [
    {
      customer: 'John Doe',
      amount: 'TZS 150,000',
      date: '2025-04-05',
      status: 'paid',
    },
    {
      customer: 'Amina Hassan',
      amount: 'TZS 200,000',
      date: '2025-04-04',
      status: 'pending',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">Loan Payments</h1>
      </div>

      <div className="bg-white shadow-md p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Payments</h2>
        
        <div className="overflow-x-auto">
          <table className="table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-3 text-gray-700 font-semibold">Customer</th>
                <th className="py-3 text-gray-700 font-semibold">Amount</th>
                <th className="py-3 text-gray-700 font-semibold">Date</th>
                <th className="py-3 text-gray-700 font-semibold">Status</th>
                <th className="py-3 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="py-3 text-gray-800 font-medium">{payment.customer}</td>
                  <td className="py-3 text-gray-800">{payment.amount}</td>
                  <td className="py-3 text-gray-600">{payment.date}</td>
                  <td className="py-3">
                    <span
                      className={
                        payment.status === 'paid'
                          ? 'status-paid'
                          : payment.status === 'pending'
                          ? 'status-pending'
                          : 'status-overdue'
                      }
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3">
                    <button className="btn btn-primary btn-sm">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}