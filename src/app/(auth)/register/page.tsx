'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Nenosiri hazilingani. Thibitisha vizuri.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user.uid);

      // Wait for Firebase session to fully activate
      await new Promise(resolve => setTimeout(resolve, 1500));

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err.code, err.message);

      let errorMessage = 'Hitilafu wakati wa kusajili. Jaribu tena.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Barua pepe hii tayari imesajiliwa.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Nenosiri ni dhaifu sana. Tumia angalau herufi 6.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Barua pepe sio sahihi.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Sajili Akaunti Mpya
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-6">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-lg"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-lg"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-lg"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xl py-5 rounded-xl shadow-lg transform hover:scale-105 transition"
        >
          {loading ? 'Inasajili...' : 'Sajili'}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Tayari una akaunti?{' '}
        <Link href="/login" className="text-blue-600 font-bold hover:underline">
          Ingia
        </Link>
      </p>
    </>
  );
}