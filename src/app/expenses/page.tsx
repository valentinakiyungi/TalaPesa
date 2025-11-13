
'use client';

import Link from 'next/link';

export default function ExpensesPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Link href="/expenses/new" className="btn btn-primary">
          Add Expense
        </Link>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <p className="text-center text-base-content/70">
            No expenses recorded yet.
          </p>
        </div>
      </div>
    </div>
  );
}
