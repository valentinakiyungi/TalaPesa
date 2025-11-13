
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Define types
interface Payment {
  date: string;
  amount: number;
}

interface Loan {
  id: string;
  amount: number;
  totalRepayable: number;
  dailyPayment: number;
  term: number;
  schedule: Payment[];
  customerId: string;
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
}

export default function LoanDetail() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [loan, setLoan] = useState<Loan | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLoan = async () => {
      if (!id) {
        setError('Invalid loan ID');
        setLoading(false);
        return;
      }

      try {
        const loanSnap = await getDoc(doc(db, 'loans', id));
        if (!loanSnap.exists()) {
          setError('Loan not found');
          setLoading(false);
          return;
        }

        const loanData = { id: loanSnap.id, ...loanSnap.data() } as Loan;
        setLoan(loanData);

        const customerSnap = await getDoc(doc(db, 'customers', loanData.customerId));
        if (customerSnap.exists()) {
          setCustomer(customerSnap.data() as Customer);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load loan');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="p-6 text-center">
        <p className="text-error text-xl mb-4">{error || 'Loan not found'}</p>
        <Link href="/loans" className="btn btn-primary">
          Back to Loans
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/loans" className="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">Loan #{loan.id.slice(0, 8)}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Loan Summary */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-xl mb-3">Loan Summary</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Amount:</strong> TZS {loan.amount.toLocaleString()}</p>
              <p><strong>Total Repayable:</strong> TZS {loan.totalRepayable.toLocaleString()}</p>
              <p><strong>Daily Payment:</strong> TZS {loan.dailyPayment.toLocaleString()}</p>
              <p><strong>Term:</strong> {loan.term} days</p>
              <p><strong>Status:</strong> <span className="badge badge-success">Active</span></p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-xl mb-3">Borrower</h2>
            {customer ? (
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {customer.name}</p>
                <p><strong>Phone:</strong> {customer.phone}</p>
                <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-base-content/70">Customer not found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="mt-8 card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Payment Schedule</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.schedule?.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{p.date}</td>
                    <td>TZS {p.amount.toLocaleString()}</td>
                    <td><span className="badge badge-ghost">Pending</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}