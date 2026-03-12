import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-bold text-white mb-4">TalaPesa</h1>
          <p className="text-2xl text-blue-100">Mkopo wa Haraka Tanzania</p>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-white/20">
          {children}
        </div>

        <p className="text-center text-blue-200 mt-8 text-sm">
          © 2026 TalaPesa • All rights reserved
        </p>
      </div>
    </div>
  );
}