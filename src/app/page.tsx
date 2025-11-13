
'use client';

import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats */}
        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <h3 className="card-title">Total Loans</h3>
            <p className="text-3xl font-bold text-primary">TZS 12.5M</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <h3 className="card-title">Active Customers</h3>
            <p className="text-3xl font-bold text-success">48</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <h3 className="card-title">Due Today</h3>
            <p className="text-3xl font-bold text-warning">TZS 850K</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/customers/new" className="btn btn-outline btn-primary">
            Add Customer
          </Link>
          <Link href="/loans/create" className="btn btn-outline btn-success">
            Create Loan
          </Link>
          <Link href="/payments/process" className="btn btn-outline btn-accent">
            Record Payment
          </Link>
          <Link href="/expenses/new" className="btn btn-outline btn-secondary">
            Add Expense
          </Link>
        </div>
      </div>
    </div>
  );
}