'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function LoansList() {
  const [loans, setLoans] = useState<any[]>([]);
  const [payAmount, setPayAmount] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'loans'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLoans(data);
    });
    return unsub;
  }, []);

  const format = (num: any) => Number(num || 0).toLocaleString();

  const recordPayment = async (loanId: string) => {
    const amount = Number(payAmount[loanId] || 0);
    if (amount <= 0) return alert('Weka kiasi cha pesa');

    const loan = loans.find(l => l.id === loanId);
    const newBalance = (loan.balanceDue || loan.totalAmount) - amount;

    await updateDoc(doc(db, 'loans', loanId), {
      balanceDue: newBalance,
      totalPaymentsMade: (loan.totalPaymentsMade || 0) + amount,
    });

    await addDoc(collection(db, 'loans', loanId, 'payments'), {
      amount,
      date: serverTimestamp(),
      method: 'Cash/M-Pesa'
    });

    setPayAmount({ ...payAmount, [loanId]: '' });
    alert('Malipo yamepokewa!');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Mikopo Yote ({loans.length})</h1>
        <Link href="/loans/create" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg">
          + Sajili Mkopo
        </Link>
      </div>

      <div className="space-y-6">
        {loans.length === 0 ? (
          <p className="text-center text-2xl text-gray-500">Hakuna mkopo bado. Anza kwa kubonyeza + Sajili Mkopo</p>
        ) : (
          loans.map(loan => (
            <div key={loan.id} className="bg-white p-8 rounded-2xl shadow-xl border">
              <div className="flex flex-col md:flex-row md:justify-between gap-6">
                <div>
                  <p className="text-3xl font-bold text-blue-900">{loan.customerName || 'Hakuna Jina'}</p>
                  <p className="text-xl text-gray-700">{loan.customerPhone || 'Hakuna Simu'}</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-lg">Kiasi cha Mkopo: <strong>TZS {format(loan.principal)}</strong></p>
                    <p className="text-lg">Jumla ya Kulipa: <strong>TZS {format(loan.totalAmount)}</strong></p>
                    <p className={loan.balanceDue > 0 ? 'text-2xl font-bold text-red-600' : 'text-2xl font-bold text-green-600'}>
                      Salio: TZS {format(loan.balanceDue)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <input
                    type="number"
                    placeholder="Weka pesa"
                    value={payAmount[loan.id] || ''}
                    onChange={e => setPayAmount({ ...payAmount, [loan.id]: e.target.value })}
                    className="w-48 px-4 py-3 border-2 border-gray-300 rounded-xl text-xl text-right"
                  />
                  <button
                    onClick={() => recordPayment(loan.id)}
                    className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold px-10 py-4 rounded-xl text-xl shadow-lg"
                  >
                    Pokea Pesa
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
