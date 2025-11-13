
'use client';

import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={36} className="text-primary" />
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/reports/sales" className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <h3 className="card-title">Sales Report</h3>
            <p className="text-3xl font-bold text-success">TZS 45.2M</p>
            <p className="text-sm text-base-content/70">This month</p>
          </div>
        </Link>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <h3 className="card-title">Collections</h3>
            <p className="text-3xl font-bold text-primary">TZS 38.7M</p>
            <p className="text-sm text-base-content/70">This month</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <h3 className="card-title">Overdue</h3>
            <p className="text-3xl font-bold text-error">TZS 2.1M</p>
            <p className="text-sm text-base-content/70">Needs attention</p>
          </div>
        </div>
      </div>
    </div>
  );
}