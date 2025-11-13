
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
  const [interestRate] = useState(15); // 15% flat
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const router = useRouter();

  const calculateLoan = () => {
    const principal = Number(amount);
    const days = Number(term);
    const interest = principal * (interestRate / 100);
    const total = principal + interest;
    const daily = total / days;

    const schedule = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 86400000).toLocaleDateString('en-GB'),
      amount: Math.round(daily),
    }));

    return { total, daily, schedule };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const customerSnap = await getDoc(doc(db, 'customers', customerId));
      if (!customerSnap.exists()) throw new Error('Customer not found');

      const customer = customerSnap.data();
      const { total, daily, schedule } = calculateLoan();

      const loan = {
        customerId,
        amount: Number(amount),
        interestRate,
        term: Number(term),
        totalRepayable: total,
        dailyPayment: daily,
        schedule,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: JSON.parse(localStorage.getItem('user')!).uid,
      };

      const loanRef = await addDoc(collection(db, 'loans'), loan);
      const loanWithId = { id: loanRef.id, ...loan };

      // Generate PDF
      const doc = await generateLoanPDF(loanWithId, customer);
      const blob = doc.output('blob');
      setPdfBlob(blob);

      alert('Loan created! Download contract below.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-contract-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <label className="label">Customer ID</label>
          <input
            type="text"
            placeholder="cus_123"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">Loan Amount (TZS)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">Term (Days)</label>
            <input
              type="number"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>
        </div>

        {amount && term && (
          <div className="alert alert-info">
            <div>
              <strong>Total Repayable:</strong> TZS {calculateLoan().total.toLocaleString()}<br />
              <strong>Daily Payment:</strong> TZS {calculateLoan().daily.toLocaleString()}
            </div>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-success flex-1">
            {loading ? 'Creating...' : 'Create Loan'}
          </button>
          <Link href="/loans" className="btn btn-ghost flex-1">Cancel</Link>
        </div>
      </form>

      {pdfBlob && (
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