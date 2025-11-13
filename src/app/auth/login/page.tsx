
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const staffRef = doc(db, 'staff', userCred.user.uid);
      const staffSnap = await getDoc(staffRef);

      // Auto-create profile if missing (e.g., password reset via console)
      if (!staffSnap.exists()) {
        await setDoc(staffRef, {
          name: email.split('@')[0].replace('.', ' '),
          email: email,
          role: 'staff',
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
        setError('Profile created! Awaiting admin approval.');
        await auth.signOut();
        setLoading(false);
        return;
      }

      const data = staffSnap.data();

      // Check approval status
      if (data.status !== 'active') {
        setError('Your account is pending admin approval.');
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Save to localStorage and redirect
      localStorage.setItem('user', JSON.stringify({ uid: userCred.user.uid, ...data }));
      router.push('/');
    } catch (err: any) {
      // Friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="card w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-6">Staff Login</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Email</span>
            </label>
            <input
              type="email"
              placeholder="staff@esncash.co.tz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered w-full"
              required
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && <div className="alert alert-error shadow-lg text-sm">{error}</div>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full font-medium"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Links */}
        <div className="text-center mt-6 space-y-2">
          <Link href="/auth/forgot" className="text-sm text-blue-600 hover:underline block">
            Forgot password?
          </Link>
          <Link href="/auth/signup" className="text-sm text-blue-600 hover:underline block">
            Register as Staff
          </Link>
        </div>
      </div>
    </div>
  );
}