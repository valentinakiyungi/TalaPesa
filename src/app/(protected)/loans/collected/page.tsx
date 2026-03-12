'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Loan {
  id: string;
  totalCollected?: number;
  customerName?: string;
  // Add any other fields displayed/used on this page
}

export default function CollectedLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'loans'), (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Loan[];

      // Filter loans that have any collection (totalCollected > 0)
      const collected = data.filter(loan => (loan.totalCollected || 0) > 0);

      setLoans(collected);
      setLoading(false);
    });

    return unsub;
  }, []);

  if (loading) return <div className="p-8 text-center">Loading collected loans...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-lg">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Collected Loans ({loans.length})</h1>

      {loans.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-600">
          No loans with collections recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Client</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Total Collected (TZS)</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Loan ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {loan.customerName || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    {loan.totalCollected?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {loan.id.slice(0, 8)}...
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