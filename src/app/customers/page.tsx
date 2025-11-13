
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('customers') || '[]');
    setCustomers(data);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Link href="/customers/new" className="btn btn-primary">
          Add Customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12 text-base-content/70">
          <p className="text-lg">No customers yet.</p>
          <Link href="/customers/new" className="link link-primary">
            Add your first customer
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <div key={c.id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-lg">{c.name}</h3>
                <p className="text-sm">
                  <strong>Phone:</strong> {c.phone}
                </p>
                {c.email && (
                  <p className="text-sm">
                    <strong>Email:</strong> {c.email}
                  </p>
                )}
                <div className="card-actions justify-end mt-3">
                  <Link href={`/customers/${c.id}`}>
                    <button className="btn btn-sm btn-ghost">View</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}