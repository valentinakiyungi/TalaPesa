'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save staff info (pending approval)
      await setDoc(doc(db, 'staff', user.uid), {
        name,
        email,
        role: 'staff',
        status: 'pending',
        createdAt: new Date(),
      });

      alert('Account created! Wait for admin approval.');
      router.push('/login');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Register as Staff</h2>
      <form onSubmit={handleRegister} className="space-y-6">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-lg"
        />
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
          minLength={6}
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-lg"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold text-xl py-5 rounded-xl shadow-lg transform hover:scale-105 transition"
        >
          {loading ? 'Creating Account...' : 'Register as Staff'}
        </button>
      </form>
      <p className="text-center mt-6 text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 font-bold hover:underline">
          Sign In
        </Link>
      </p>
    </>
  );
}
