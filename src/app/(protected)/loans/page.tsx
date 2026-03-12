'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';

export default function AllLoans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'loans'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLoans(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-2xl text-gray-700">Inapakia mikopo yote...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back to Dashboard Button */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-lg"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-8">Mikopo Yote ({loans.length})</h1>

      {loans.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <p className="text-xl text-gray-600 mb-6">
            Hakuna mikopo iliyosajiliwa bado.
          </p>
          <Link
            href="/loans/create"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition"
          >
            Sajili Mkopo Mpya
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Mteja
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Kiasi (TZS)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Jumla ya Kulipa (TZS)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Hali
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Tarehe
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Hatua
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                    {loan.customerName || 'Unknown'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                    {loan.principal ? loan.principal.toLocaleString('en-US') : '-'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                    {loan.totalAmount ? loan.totalAmount.toLocaleString('en-US') : '-'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        loan.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : loan.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : loan.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {loan.status === 'active'
                        ? 'Hai'
                        : loan.status === 'overdue'
                        ? 'Imechelewa'
                        : loan.status === 'pending'
                        ? 'Inasubiri'
                        : loan.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                    {loan.createdAt?.toDate?.()
                      ? loan.createdAt.toDate().toLocaleDateString('sw-TZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '-'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm">
                    <Link
                      href={`/loans/${loan.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Eye size={18} />
                      View
                    </Link>
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