'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewExpense() {
  const [form, setForm] = useState({ description: '', amount: '' });
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    expenses.push({ id: Date.now(), ...form, date: new Date().toISOString() });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    router.push('/expenses');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add Expense</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input input-bordered w-full"
          required
        />
        <input
          type="number"
          placeholder="Amount (TZS)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="input input-bordered w-full"
          required
        />
        <button type="submit" className="btn btn-error w-full">Record Expense</button>
      </form>
    </div>
  );
}