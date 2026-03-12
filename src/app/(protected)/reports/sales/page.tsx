'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SalesReportPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reports" className="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">Sales Report</h1>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Monthly Sales Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Loan Disbursements</span>
              <span className="font-bold">TZS 50.0M</span>
            </div>
            <div className="flex justify-between">
              <span>Interest Income</span>
              <span className="font-bold text-success">TZS 8.2M</span>
            </div>
            <div className="flex justify-between">
              <span>Fees</span>
              <span className="font-bold">TZS 1.0M</span>
            </div>
            <div className="divider"></div>
            <div className="flex justify-between text-lg">
              <span>Total Revenue</span>
              <span className="font-bold text-success">TZS 59.2M</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button className="btn btn-primary">
          Export to PDF
        </button>
      </div>
    </div>
  );
}
