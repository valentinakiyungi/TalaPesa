
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoanDetails() {
  const { id } = useParams();
  const [loan, setLoan] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loans = JSON.parse(localStorage.getItem('loans') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const foundLoan = loans.find((l: any) => l.id === id);
    const foundCustomer = customers.find((c: any) => c.id === foundLoan?.customerId);
    setLoan(foundLoan);
    setCustomer(foundCustomer);
  }, [id]);

  if (!loan) return <p className="p-6">Loan not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="btn btn-ghost btn-sm mb-4"
      >
        Back
      </button>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h1 className="text-2xl font-bold">Loan #{loan.id}</h1>
          <p><strong>Customer:</strong> {customer?.name} ({customer?.phone})</p>
          <p><strong>Amount:</strong> TZS {Number(loan.amount).toLocaleString()}</p>
          <p><strong>Interest:</strong> {loan.interest}%</p>
          <p><strong>Term:</strong> {loan.term} days</p>
          <p><strong>Status:</strong> <span className="badge badge-success">Active</span></p>
          <p><strong>Created:</strong> {new Date(loan.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}