
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      alert('Wrong email or password');
    }
    setLoading(false);
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Staff Login</h2>
      <form onSubmit={handleLogin} className="space-y-6">
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
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xl py-5 rounded-xl shadow-lg transform hover:scale-105 transition"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center mt-6 text-gray-600">
        Don't have an account?{' '}
        <Link href="/register" className="text-blue-600 font-bold hover:underline">
          Register
        </Link>
      </p>
    </>
  );
}
