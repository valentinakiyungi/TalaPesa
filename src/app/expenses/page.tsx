'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

export default function AddExpense() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('office');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Expense recorded: TZS ' + Number(amount).toLocaleString());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 mb-6">
          <ArrowLeft size={20} /> Back
        </Link>

        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            <Plus className="inline-block mr-3 text-red-600" size={36} />
            Record New Expense
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label-text block mb-2">Description</label>
              <input
                type="text"
                placeholder="e.g. Office Rent, Fuel, Staff Lunch"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label-text block mb-2">Amount (TZS)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label-text block mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                <option value="office">Office Rent</option>
                <option value="transport">Transport/Fuel</option>
                <option value="marketing">Marketing</option>
                <option value="staff">Staff Welfare</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="btn bg-red-600 hover:bg-red-700 text-white w-full py-5 text-xl">
              Record Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}