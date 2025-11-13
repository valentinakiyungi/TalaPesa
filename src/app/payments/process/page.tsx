'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProcessPayment() {
  const [loans, setLoans] = useState<any[]>([]);
  const [form, setForm] = useState({ loanId: '', amount: '' });
  const router = useRouter();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('loans') || '[]');
    setLoans(data.filter((l: any) => l.status === 'active'));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payments = JSON.parse(localStorage.getItem('payments') || '[]');
    payments.push({ id: Date.now(), ...form, date: new Date().toISOString() });
    localStorage.setItem('payments', JSON.stringify(payments));
    router.push('/payments');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Process Payment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          className="select select-bordered w-full"
          value={form.loanId}
          onChange={(e) => setForm({ ...form, loanId: e.target.value })}
          required
        >
          <option value="">Select Loan</option>
          {loans.map((loan) => (
            <option key={loan.id} value={loan.id}>Loan #{loan.id} (TZS {loan.amount})</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount Paid"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="input input-bordered w-full"
          required
        />
        <button type="submit" className="btn btn-success w-full">Record Payment</button>
      </form>
    </div>
  );
}