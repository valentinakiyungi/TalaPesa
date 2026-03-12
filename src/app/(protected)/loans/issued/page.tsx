'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function IssuedLoans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'loans'), (snap) => {
      setLoans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-lg">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">All Issued Loans ({loans.length})</h1>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Client</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loans.map(loan => (
              <tr key={loan.id}>
                <td className="px-6 py-4 whitespace-nowrap">{loan.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap">TZS {loan.principal?.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{loan.loanDuration} months</td>
                <td className="px-6 py-4 whitespace-nowrap">{loan.createdAt?.toDate?.().toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{loan.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}