'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

const SETTINGS_DOC_ID = 'company_settings';
const SETTINGS_COLLECTION = 'settings';

export default function SettingsPage() {
  const [interestRate, setInterestRate] = useState<number>(10);
  const [minAmount, setMinAmount] = useState<number>(50000);
  const [maxAmount, setMaxAmount] = useState<number>(5000000);
  const [lateFeeRate, setLateFeeRate] = useState<number>(5);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(7);
  const [maxActiveLoansPerCustomer, setMaxActiveLoansPerCustomer] = useState<number>(2);
  const [maxLoanToIncomeRatio, setMaxLoanToIncomeRatio] = useState<number>(50);
  const [newLoansEnabled, setNewLoansEnabled] = useState<boolean>(true);
  const [durationOptions, setDurationOptions] = useState<number[]>([3, 6, 9, 12, 18, 24]);
  const [newDuration, setNewDuration] = useState<number>(0);

  // New notification templates
  const [disbursementMessage, setDisbursementMessage] = useState<string>(
    'Mpokeaji, mkopo wako wa TZS {amount} umefanikiwa kutolewa. Thibitisha malipo ya kwanza ifikapo {dueDate}. Asante kwa kutuchagua!'
  );
  const [monthlyReminderMessage, setMonthlyReminderMessage] = useState<string>(
    'Mteja, malipo yako ya TZS {monthlyAmount} kwa mkopo ni ya {dueDate}. Lipa kupitia {paymentMethods} ili kuepuka ada za kuchelewa.'
  );
  const [overdueMessage, setOverdueMessage] = useState<string>(
    'Mkopo wako una deni la TZS {balance} lililopitwa na muda. Ada ya {lateFee} itaongezwa kila mwezi. Tafadhali lipa haraka ili kuepuka madhara zaidi.'
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInterestRate(data.interestRate ?? 10);
        setMinAmount(data.minAmount ?? 50000);
        setMaxAmount(data.maxAmount ?? 5000000);
        setLateFeeRate(data.lateFeeRate ?? 5);
        setGracePeriodDays(data.gracePeriodDays ?? 7);
        setMaxActiveLoansPerCustomer(data.maxActiveLoansPerCustomer ?? 2);
        setMaxLoanToIncomeRatio(data.maxLoanToIncomeRatio ?? 50);
        setNewLoansEnabled(data.newLoansEnabled ?? true);
        setDurationOptions(data.durationOptions ?? [3, 6, 9, 12, 18, 24]);

        // Load notification templates if they exist
        setDisbursementMessage(data.disbursementMessage || disbursementMessage);
        setMonthlyReminderMessage(data.monthlyReminderMessage || monthlyReminderMessage);
        setOverdueMessage(data.overdueMessage || overdueMessage);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to load settings');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      await setDoc(docRef, {
        interestRate,
        minAmount,
        maxAmount,
        lateFeeRate,
        gracePeriodDays,
        maxActiveLoansPerCustomer,
        maxLoanToIncomeRatio,
        newLoansEnabled,
        durationOptions,
        // New notification templates
        disbursementMessage,
        monthlyReminderMessage,
        overdueMessage,
        updatedAt: new Date(),
      }, { merge: true });

      setMessage('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addDuration = () => {
    if (newDuration > 0 && !durationOptions.includes(newDuration)) {
      setDurationOptions([...durationOptions, newDuration].sort((a, b) => a - b));
      setNewDuration(0);
    }
  };

  const removeDuration = (value: number) => {
    setDurationOptions(durationOptions.filter(v => v !== value));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">TalaPesa Loan Settings</h1>
          <p className="text-lg text-gray-600">
            These settings apply globally to all new loans
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-10 space-y-12">
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Core Loan Parameters */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700">
                Interest Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700">
                Late Fee Rate (% per month)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={lateFeeRate}
                onChange={(e) => setLateFeeRate(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700">
                Minimum Loan Amount (TZS)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700">
                Maximum Loan Amount (TZS)
              </label>
              <input
                type="number"
                min="10000"
                step="10000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
              />
            </div>
          </div>

          {/* Grace Period & Max Loans */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700">
                Grace Period (days after due date)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
              />
              <p className="text-sm text-gray-500">Days before late fees start</p>
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700">
                Max Active Loans per Customer
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxActiveLoansPerCustomer}
                onChange={(e) => setMaxActiveLoansPerCustomer(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
              />
              <p className="text-sm text-gray-500">0 = no limit</p>
            </div>
          </div>

          {/* New Loans Toggle */}
          <div className="flex items-center justify-between py-4 border-t border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Allow New Loan Applications</h3>
              <p className="text-sm text-gray-500">Disable globally if needed (e.g., maintenance)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={newLoansEnabled}
                onChange={() => setNewLoansEnabled(!newLoansEnabled)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Duration Options */}
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-700">
              Allowed Loan Duration Options (months)
            </label>
            <div className="flex flex-wrap gap-3">
              {durationOptions.map((dur) => (
                <div
                  key={dur}
                  className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-blue-800"
                >
                  <span>{dur} months</span>
                  <button
                    onClick={() => removeDuration(dur)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="60"
                value={newDuration || ''}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                placeholder="Add new duration"
                className="w-40 px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
              />
              <button
                type="button"
                onClick={addDuration}
                disabled={newDuration <= 0 || durationOptions.includes(newDuration)}
                className={`px-6 py-3 rounded-xl text-white flex items-center justify-center ${
                  newDuration > 0 && !durationOptions.includes(newDuration)
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* SMS/Email Notification Templates */}
          <div className="space-y-6 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800">SMS / Email Notification Templates</h3>
            <p className="text-sm text-gray-600">
              Customize default messages sent to customers. Use placeholders like <code>{'{amount}'}</code>, <code>{'{dueDate}'}</code>, <code>{'{monthlyAmount}'}</code>, <code>{'{lateFee}'}</code>, <code>{'{balance}'}</code>, <code>{'{paymentMethods}'}</code> etc.
            </p>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="block text-lg font-medium text-gray-700">
                  Disbursement Message (when loan is approved/released)
                </label>
                <textarea
                  value={disbursementMessage}
                  onChange={(e) => setDisbursementMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base resize-y"
                  placeholder="Mpokeaji, mkopo wako wa TZS {amount} umefanikiwa kutolewa..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-medium text-gray-700">
                  Monthly Reminder Message
                </label>
                <textarea
                  value={monthlyReminderMessage}
                  onChange={(e) => setMonthlyReminderMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base resize-y"
                  placeholder="Mteja, malipo yako ya TZS {monthlyAmount} yanatarajiwa ifikapo {dueDate}..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-medium text-gray-700">
                  Overdue Message
                </label>
                <textarea
                  value={overdueMessage}
                  onChange={(e) => setOverdueMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base resize-y"
                  placeholder="Mkopo wako una deni la TZS {balance}. Ada ya {lateFee}% itaongezwa..."
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-8 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save All Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}