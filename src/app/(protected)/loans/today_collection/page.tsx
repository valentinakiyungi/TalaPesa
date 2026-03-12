'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Calendar, AlertCircle, Loader2 } from 'lucide-react';  // ← Added missing icons
import { format } from 'date-fns';

interface Loan {
  id: string;
  status?: string;
  balanceDue?: number;
  nextDueDate?: any;
  dueDate?: any;
  nextPaymentDate?: any;
  customerName?: string;
}

export default function TodaysCollection() {
  const [loansDueToday, setLoansDueToday] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[TodaysCollection] Starting real-time listener on loans collection');

    const unsub = onSnapshot(collection(db, 'loans'), (snap) => {
      if (snap.empty) {
        console.log('[TodaysCollection] No loans found in Firestore at all');
      } else {
        console.log(`[TodaysCollection] Found ${snap.size} loans in total`);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('[TodaysCollection] Today (start of day):', today.toISOString());

      const data = snap.docs
        .map(doc => {
          const loan = { id: doc.id, ...doc.data() } as Loan;
          console.log(`[TodaysCollection] Processing loan ${loan.id}:`, {
            status: loan.status,
            balanceDue: loan.balanceDue,
            nextDueDate: loan.nextDueDate?.toDate?.()?.toISOString(),
            nextPaymentDate: loan.nextPaymentDate?.toDate?.()?.toISOString(),
            dueDate: loan.dueDate?.toDate?.()?.toISOString(),
            customerName: loan.customerName,
          });
          return loan;
        })
        .filter(loan => {
          const dueDateField = loan.nextDueDate || loan.dueDate || loan.nextPaymentDate;
          const due = dueDateField?.toDate?.();

          if (!due) {
            console.log(`[TodaysCollection] Loan ${loan.id} has no due date field`);
            return false;
          }

          const dueStart = new Date(due);
          dueStart.setHours(0, 0, 0, 0);

          const isToday = dueStart.getTime() === today.getTime();
          const hasBalance = (loan.balanceDue || 0) > 0;

          console.log(`[TodaysCollection] Loan ${loan.id} → Due today? ${isToday} | Has balance? ${hasBalance}`);

          return isToday && hasBalance;
        });

      console.log('[TodaysCollection] Final loans due today:', data.length, data);
      setLoansDueToday(data);
      setLoading(false);
    }, (err) => {
      console.error('[TodaysCollection] Firestore listener error:', err);
      setLoading(false);
    });

    return unsub;
  }, []);

  const todayFormatted = format(new Date(), 'dd MMMM yyyy');

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">Inapakia mikopo ya leo...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-lg">
          <ArrowLeft size={20} />
          Rudi Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Calendar size={32} className="text-blue-600" />
        Mikopo ya Leo – {todayFormatted} ({loansDueToday.length})
      </h1>

      {loansDueToday.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-10 text-center max-w-3xl mx-auto">
          <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-6" />
          <p className="text-2xl font-medium text-yellow-800 mb-4">
            Hakuna mkopo wa leo
          </p>
          <p className="text-lg text-gray-700 mb-6">
            Tarehe ya leo ({todayFormatted}) hakuna malipo yoyote yanayotarajiwa kutoka kwa wateja.
          </p>
          <p className="text-gray-600 mb-8">
            Hii inaweza kuwa kwa sababu:
          </p>
          <ul className="text-left text-gray-700 max-w-lg mx-auto mb-8 space-y-2">
            <li>• Hakuna mikopo iliyoanza au iliyopangwa leo</li>
            <li>• Malipo yote yamekamilika au yamepitwa na muda</li>
            <li>• Tarehe za malipo ziko siku zijazo</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/loans/overdue"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Angalia Mikopo Iliyopitwa na Muda
            </Link>
            <Link
              href="/loans"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Angalia Mikopo Yote
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Mteja</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Kiasi Kinachotakiwa (TZS)</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Mkopo ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Tarehe ya Mwisho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loansDueToday.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {loan.customerName || 'Hajajulikana'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                    {(loan.balanceDue || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {loan.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {loan.nextDueDate?.toDate?.()?.toLocaleDateString('en-GB') ||
                     loan.dueDate?.toDate?.()?.toLocaleDateString('en-GB') ||
                     loan.nextPaymentDate?.toDate?.()?.toLocaleDateString('en-GB') ||
                     'N/A'}
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