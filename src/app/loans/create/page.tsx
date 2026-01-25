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

  // Step 2 - Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerIdNumber, setCustomerIdNumber] = useState('');

  // Step 3 - Guarantor
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('');

  const totalAmount = Number(principal) * 1.1;
  const monthlyPayment = totalAmount / Number(durationMonths);

  const validatePhone = (phone: string) => {
    return phone.length >= 9 && phone.startsWith('0') || phone.startsWith('+255');
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return alert('Login first');

    // Basic validation
    if (!validatePhone(customerPhone)) return alert('Namba ya simu ya mteja si sahihi (lazima ianze na 0 au +255)');
    if (!validatePhone(guarantorPhone)) return alert('Namba ya simu ya mdhamini si sahihi');

    setLoading(true);
    try {
      await addDoc(collection(db, 'loans'), {
        principal: Number(principal),
        loanDuration: Number(durationMonths),
        totalAmount,
        balanceDue: totalAmount,
        monthlyPayment,
        customerName,
        customerPhone,
        customerIdNumber,
        guarantorName,
        guarantorPhone,
        guarantorRelation,
        status: 'pending',
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        payments: []
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

      {/* Progress Bar */}
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
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">1. Chagua Kiasi & Muda wa Mkopo</h2>
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
              <p className="text-lg">Malipo ya kila mwezi: <strong>TZS {monthlyPayment.toLocaleString()}</strong></p>
            </div>
          </div>
        )}

        {/* Step 2 - Customer */}
        {step === 2 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">2. Taarifa za Mteja</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2">Jina Kamili la Mteja</label>
                <input
                  placeholder="Jina Kamili"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Namba ya Simu ya Mteja</label>
                <input
                  placeholder="e.g. 0768000111 au +255768000111"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Namba ya Kitambulisho</label>
                <input
                  placeholder="Namba ya Kitambulisho"
                  required
                  value={customerIdNumber}
                  onChange={e => setCustomerIdNumber(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 - Guarantor */}
        {step === 3 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">3. Taarifa za Mdhamini</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2">Jina Kamili la Mdhamini</label>
                <input
                  placeholder="Jina la Mdhamini"
                  required
                  value={guarantorName}
                  onChange={e => setGuarantorName(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Namba ya Simu ya Mdhamini</label>
                <input
                  placeholder="e.g. 0768000111 au +255768000111"
                  required
                  value={guarantorPhone}
                  onChange={e => setGuarantorPhone(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Uhusiano na Mteja</label>
                <input
                  placeholder="e.g. Dada, Kaka, Mzazi"
                  required
                  value={guarantorRelation}
                  onChange={e => setGuarantorRelation(e.target.value)}
                  className="w-full px-5 py-4 border-2 rounded-xl text-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4 - Confirm & Submit */}
        {step === 4 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">4. Thibitisha & Tuma Mkopo</h2>
            <div className="p-6 bg-gray-50 rounded-xl space-y-4 text-lg">
              <p><strong>Mteja:</strong> {customerName} | Simu: {customerPhone}</p>
              <p><strong>Kiasi cha Mkopo:</strong> TZS {Number(principal).toLocaleString()}</p>
              <p><strong>Jumla ya Kulipa:</strong> TZS {totalAmount.toLocaleString()}</p>
              <p><strong>Muda:</strong> {durationMonths} Miezi</p>
              <p><strong>Mdhamini:</strong> {guarantorName} | Simu: {guarantorPhone}</p>
              <p className="text-green-600 font-semibold mt-6">
                Thibitisha kuwa taarifa zote ni sahihi kabla ya kutuma
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-2xl py-6 rounded-2xl shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Inasajili...
                </>
              ) : (
                'Tuma Mkopo Sasa'
              )}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-10 py-5 bg-gray-300 hover:bg-gray-400 rounded-xl text-xl font-bold flex items-center gap-3"
            >
              <ArrowLeft size={24} /> Nyuma
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="ml-auto px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-xl text-xl font-bold flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : step === 4 ? 'Tuma Mkopo' : 'Endelea'}
            {step < 4 && <ArrowRight size={24} />}
          </button>
        </div>
      </form>
    </div>
  );
}