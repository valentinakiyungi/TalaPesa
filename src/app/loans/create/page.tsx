'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CreateLoan() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Principal & Duration
  const [principal, setPrincipal] = useState('');
  const [durationMonths, setDurationMonths] = useState('6');

  // Step 2 - Customer KYC
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerIdNumber, setCustomerIdNumber] = useState('');

  // Step 3 - Sponsor
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('');

  // Step 4 - Submit
  const totalAmount = Number(principal) * 1.1; // Example 10% interest flat

  const handleSubmit = async () => {
    if (!auth.currentUser) return alert('Login first');

    setLoading(true);
    try {
      await addDoc(collection(db, 'loans'), {
        principal: Number(principal),
        loanDuration: Number(durationMonths),
        totalAmount,
        balanceDue: totalAmount,
        customerName,
        customerPhone,
        customerIdNumber,
        guarantorName,
        guarantorPhone,
        guarantorRelation,
        status: 'pending',
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        payments: [] // payments added later
      });

      alert('Mkopo umesajiliwa kikamilifu!');
      router.push('/loans');
    } catch (err: any) {
      alert('Hitilafu: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Sajili Mkopo Mpya</h1>

      <div className="mb-10">
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
          <span>1. Kiasi & Muda</span>
          <span>2. Mteja</span>
          <span>3. Mdhamini</span>
          <span>4. Thibitisha</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); step === 4 ? handleSubmit() : setStep(step + 1); }}>
        {step === 1 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">1. Chagua Kiasi & Muda</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2">Kiasi cha Mkopo (TZS)</label>
                <input
                  type="number"
                  required
                  value={principal}
                  onChange={e => setPrincipal(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-xl"
                  placeholder="e.g. 500000"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Muda (Miezi)</label>
                <select
                  value={durationMonths}
                  onChange={e => setDurationMonths(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-xl"
                >
                  <option value="3">3 Miezi</option>
                  <option value="6">6 Miezi</option>
                  <option value="9">9 Miezi</option>
                  <option value="12">12 Miezi</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl text-center">
              <p className="text-xl">Jumla ya Kulipa: <strong>TZS {totalAmount.toLocaleString()}</strong></p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">2. Taarifa za Mteja</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <input placeholder="Jina Kamili" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="px-5 py-4 border-2 rounded-xl text-lg" />
              <input placeholder="Namba ya Simu" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="px-5 py-4 border-2 rounded-xl text-lg" />
              <input placeholder="Namba ya Kitambulisho" required value={customerIdNumber} onChange={e => setCustomerIdNumber(e.target.value)} className="px-5 py-4 border-2 rounded-xl text-lg" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">3. Mdhamini</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <input placeholder="Jina la Mdhamini" required value={guarantorName} onChange={e => setGuarantorName(e.target.value)} className="px-5 py-4 border-2 rounded-xl text-lg" />
              <input placeholder="Simu ya Mdhamini" required value={guarantorPhone} onChange={e => setGuarantorPhone(e.target.value)} className="px-5 py-4 border-2 rounded-xl text-lg" />
              <input placeholder="Uhusiano" required value={guarantorRelation} onChange={e => setGuarantorRelation(e.target.value)} className="px-5 py-4 border-2 rounded-xl text-lg" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">4. Thibitisha & Tuma</h2>
            <div className="p-6 bg-gray-50 rounded-xl space-y-4">
              <p><strong>Mteja:</strong> {customerName} ({customerPhone})</p>
              <p><strong>Kiasi:</strong> TZS {Number(principal).toLocaleString()}</p>
              <p><strong>Jumla ya Kulipa:</strong> TZS {totalAmount.toLocaleString()}</p>
              <p><strong>Muda:</strong> {durationMonths} Miezi</p>
              <p><strong>Mdhamini:</strong> {guarantorName} ({guarantorPhone})</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-2xl py-6 rounded-2xl shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Tuma Mkopo'}
            </button>
          </div>
        )}

        <div className="flex justify-between pt-8">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="px-10 py-5 bg-gray-300 rounded-xl text-xl font-bold flex items-center gap-3">
              <ArrowLeft /> Nyuma
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="ml-auto px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl text-xl font-bold flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : step === 4 ? 'Tuma Mkopo' : 'Endelea'}
            {step < 4 && <ArrowRight />}
          </button>
        </div>
      </form>
    </div>
  );
}
