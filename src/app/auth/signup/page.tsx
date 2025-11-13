
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';

export default function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!form.name.trim()) return setError('Full name is required');
    if (!form.email.includes('@')) return setError('Enter a valid email');
    if (form.password.length < 6) return setError('Password must be 6+ characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setLoading(true);

    try {
      // Create Auth user
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // Create Firestore staff profile
      await setDoc(doc(db, 'staff', userCred.user.uid), {
        name: form.name.trim(),
        email: form.email,
        role: 'staff',
        status: 'pending', // Admin must approve
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email already registered'
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="card w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-6">Register as Staff</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Full Name</span>
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input input-bordered w-full"
              required
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Email</span>
            </label>
            <input
              type="email"
              placeholder="staff@esncash.co.tz"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input input-bordered w-full"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Password</span>
            </label>
            <input
              type="password"
              placeholder="6+ characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input input-bordered w-full"
              required
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Confirm Password</span>
            </label>
            <input
              type="password"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="input input-bordered w-full"
              required
              disabled={loading}
            />
          </div>

          {/* Error / Success */}
          {error && <div className="alert alert-error shadow-lg text-sm">{error}</div>}
          {success && (
            <div className="alert alert-success shadow-lg text-sm">
              Account created! Awaiting admin approval. Redirecting...
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-success w-full text-white font-medium"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>
                Creating...
              </>
            ) : (
              'Register as Staff'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:underline block">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}