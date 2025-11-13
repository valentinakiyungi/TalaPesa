
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateLoanPDF } from '@/lib/pdf';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function CreateLoan() {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const router = useRouter();

  const calculateLoan = () => {
    const principal = Number(amount) || 0;
    const days = Number(term) || 0;
    if (!principal || !days) return null;

    const interestRate = 15; // 15%
    const interest = principal * (interestRate / 100);
    const total = principal + interest;
    const daily = Math.round(total / days);

    const schedule = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 86400000).toLocaleDateString('en-GB'),
      amount: daily,
    }));

    return { total, daily, schedule };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const calc = calculateLoan();
      if (!calc) throw new Error('Invalid amount or term');

      const customerSnap = await getDoc(doc(db, 'customers', customerId));
      if (!customerSnap.exists()) throw new Error('Customer not found');

      const customer = customerSnap.data();

      const loanData = {
        customerId,
        amount: Number(amount),
        interestRate: 15,
        term: Number(term),
        totalRepayable: calc.total,
        dailyPayment: calc.daily,
        schedule: calc.schedule,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: JSON.parse(localStorage.getItem('user') || '{}').uid,
      };

      const loanRef = await addDoc(collection(db, 'loans'), loanData);
      const loanWithId = { id: loanRef.id, ...loanData };

      // Generate PDF
      const pdfDoc = await generateLoanPDF(loanWithId, customer);
      const blob = pdfDoc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      alert('Loan created successfully! Download contract below.');
    } catch (err: any) {
      setError(err.message || 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `loan-contract-${Date.now()}.pdf`;
    a.click();
  };

  const calc = calculateLoan();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/loans" className="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">Create New Loan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Customer ID</span>
          </label>
          <input
            type="text"
            placeholder="cus_123"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="input input-bordered w-full"
            required
            disabled={loading}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Loan Amount (TZS)</span>
            </label>
            <input
              type="number"
              min="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input input-bordered w-full"
              required
              disabled={loading}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Term (Days)</span>
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="input input-bordered w-full"
              required
              disabled={loading}
            />
          </div>
        </div>

        {calc && (
          <div className="alert alert-info">
            <div>
              <strong>Total Repayable:</strong> TZS {calc.total.toLocaleString()}<br />
              <strong>Daily Payment:</strong> TZS {calc.daily.toLocaleString()}
            </div>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !calc}
            className="btn btn-success flex-1"
          >
            {loading ? 'Creating...' : 'Create Loan'}
          </button>
          <Link href="/loans" className="btn btn-ghost flex-1">
            Cancel
          </Link>
        </div>
      </form>

      {pdfUrl && (
        <div className="mt-8 text-center">
          <button onClick={downloadPDF} className="btn btn-primary">
            <Download size={18} className="mr-2" />
            Download Contract PDF
          </button>
        </div>
      )}
    </div>
  );
}