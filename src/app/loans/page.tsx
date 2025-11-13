
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const loanData = JSON.parse(localStorage.getItem('loans') || '[]');
    const custData = JSON.parse(localStorage.getItem('customers') || '[]');
    setLoans(loanData);
    setCustomers(custData);
  }, []);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Loans</h1>
        <Link href="/loans/create" className="btn btn-primary">
          Create Loan
        </Link>
      </div>

      {loans.length === 0 ? (
        <div className="text-center py-12 text-base-content/70">
          <p className="text-lg">No loans yet.</p>
          <Link href="/loans/create" className="link link-primary">
            Create your first loan
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="card bg-base-100 shadow hover:shadow-lg transition-shadow"
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="card-title text-lg">
                      {getCustomerName(loan.customerId)}
                    </h3>
                    <p className="text-sm text-base-content/70">
                      TZS {Number(loan.amount).toLocaleString()} • {loan.term} days
                    </p>
                  </div>
                  <div
                    className={`badge badge-lg ${
                      loan.status === 'active' ? 'badge-success' : 'badge-error'
                    }`}
                  >
                    {loan.status}
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <Link href={`/loans/${loan.id}`}>
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