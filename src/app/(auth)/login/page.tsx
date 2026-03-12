'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, X } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        document.cookie = `auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
        router.replace('/dashboard');
        router.refresh();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      document.cookie = `auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;

      router.replace('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('Barua pepe au nenosiri sio sahihi. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);
    setResetError(null);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetMessage('Barua pepe ya kurejesha nenosiri imetumwa. Angalia barua pepe yako (na folda ya Spam).');
      setResetEmail('');
      setTimeout(() => setShowResetModal(false), 5000);
    } catch (err: any) {
      setResetError('Hitilafu: ' + (err.message || 'Jaribu tena baadaye.'));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-gray-800">
        Ingia kwenye Akaunti
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Barua Pepe (Email)
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg transition"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Nenosiri (Password)
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg transition"
          />
        </div>

        <div className="flex justify-end text-sm">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-blue-600 hover:text-blue-800 font-medium underline"
          >
            Umesahau nenosiri?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-3 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white hover:shadow-lg hover:scale-[1.02]'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Inaitisha...
            </>
          ) : (
            'Ingia'
          )}
        </button>
      </form>

      <p className="text-center text-gray-600 mt-6">
        Huna akaunti?{' '}
        <Link
          href="/register"
          className="text-blue-600 font-semibold hover:text-blue-800 hover:underline"
        >
          Sajili
        </Link>
      </p>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
              <button
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
              >
                <X size={28} />
              </button>

              <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">
                Umesahau Nenosiri?
              </h3>

              <p className="text-center text-gray-600 mb-6">
                Weka barua pepe yako na tutakutumia kiungo cha kurejesha nenosiri.
              </p>

              {resetMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-center">
                  {resetMessage}
                </div>
              )}

              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-center">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Barua Pepe
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-3 ${
                    resetLoading
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Inatuma...
                    </>
                  ) : (
                    'Tuma Kiungo'
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}