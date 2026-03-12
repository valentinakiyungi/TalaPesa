'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Loan {
  id: string;
  balanceDue?: number;
  principal?: number;
  loanDuration?: number;
  createdAt?: any; // Firebase Timestamp
  customerName?: string;
  // Add more fields if you use them on this page
}

export default function OverdueLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unsub = onSnapshot(collection(db, 'loans'), (snap) => {
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as Loan)
        .filter(loan => {
          if ((loan.balanceDue || 0) <= 0) return false;
          const start = loan.createdAt?.toDate?.();
          if (!start) return false;
          const due = new Date(start.getTime() + (loan.loanDuration || 0) * 30 * 24 * 60 * 60 * 1000);
          return due < today;
        });

      setLoans(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  if (loading) return <div className="p-8 text-center">Loading overdue loans...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-lg">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Overdue Loans ({loans.length})</h1>

      {loans.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-600">
          No overdue loans at the moment. All clients are up to date!
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Client</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Balance Due (TZS)</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Principal (TZS)</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Duration (months)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {loan.customerName || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                    {(loan.balanceDue || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(loan.principal || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {loan.loanDuration || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}