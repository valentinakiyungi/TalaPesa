
'use client';

import Link from 'next/link';

export default function PaymentsPage() {
  // Mock data - replace with localStorage or Firebase later
  const payments = [
    { id: 1, customer: 'John Doe', amount: 150000, date: '2025-04-05', status: 'paid' },
    { id: 2, customer: 'Amina Hassan', amount: 200000, date: '2025-04-04', status: 'pending' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Link href="/payments/process" className="btn btn-primary">
          Record Payment
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 text-base-content/70">
          <p className="text-lg">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.customer}</td>
                  <td>TZS {p.amount.toLocaleString()}</td>
                  <td>{p.date}</td>
                  <td>
                    <span
                      className={`badge ${
                        p.status === 'paid' ? 'badge-success' : 'badge-warning'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost">View</button>
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