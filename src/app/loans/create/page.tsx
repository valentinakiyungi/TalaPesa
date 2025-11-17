'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateLoanPDF } from '@/lib/pdf';
import { ArrowLeft, Download, Calculator, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function CreateLoan() {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const router = useRouter();

  const calculateLoan = () => {
    const principal = Number(amount) || 0;
    const days = Number(term) || 0;
    if (!principal || !days) return null;

    const interest = principal * 0.15;
    const total = principal + interest;
    const daily = Math.round(total / days);

    return { interest, total, daily };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const calc = calculateLoan();
      if (!calc) throw new Error('Please fill amount and term');

      const customerSnap = await getDoc(doc(db, 'customers', customerId));
      if (!customerSnap.exists()) throw new Error('Customer not found');
      const customer = customerSnap.data();
      setCustomerName(customer.name || 'Unknown');

      const loanData = {
        customerId,
        customerName: customer.name,
        amount: Number(amount),
        interest: calc.interest,
        totalRepayable: calc.total,
        dailyPayment: calc.daily,
        term: Number(term),
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const loanRef = await addDoc(collection(db, 'loans'), loanData);
      const loanWithId = { id: loanRef.id, ...loanData };

      const pdfDoc = await generateLoanPDF(loanWithId, customer);
      const blob = pdfDoc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      alert('Loan created successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calc = calculateLoan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/loans" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft size={20} /> Back to Loans
        </Link>

        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            <Calculator className="inline-block mr-3 text-blue-600" size={36} />
            Create New Loan
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label-text block mb-2">Customer ID</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="cus_abc123"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="input flex-1"
                  required
                />
                <button type="button" className="btn btn-success whitespace-nowrap">
                  <UserCheck size={20} /> Verify
                </button>
              </div>
              {customerName && <p className="mt-2 text-green-600 font-semibold">Customer: {customerName}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label-text block mb-2">Loan Amount (TZS)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label-text block mb-2">Term (Days)</label>
                <input type="number" min="1" max="90" value={term} onChange={(e) => setTerm(e.target.value)} className="input" required />
              </div>
            </div>

            {calc && (
              <div className="alert-info text-center p-6 rounded-2xl">
                <p className="text-2xl font-bold">Total Repayable: TZS {calc.total.toLocaleString()}</p>
                <p className="text-lg mt-2">Daily Payment: <strong>TZS {calc.daily.toLocaleString()}</strong></p>
                <p className="text-sm text-gray-600 mt-3">Interest (15%): TZS {calc.interest.toLocaleString()}</p>
              </div>
            )}

            {error && <div className="alert-error">{error}</div>}

            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="btn btn-primary flex-1 text-xl py-4">
                {loading ? 'Creating Loan...' : 'Create Loan & Generate Contract'}
              </button>
              <Link href="/loans" className="btn btn-ghost flex-1 text-xl py-4">Cancel</Link>
            </div>
          </form>

          {pdfUrl && (
            <div className="mt-10 text-center">
              <a href={pdfUrl} download={`loan-${customerId}.pdf`} className="btn btn-success text-xl px-10 py-5 inline-flex items-center gap-3">
                <Download size={28} /> Download Contract PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}