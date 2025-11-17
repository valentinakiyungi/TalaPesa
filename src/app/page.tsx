'use client';

import Link from 'next/link';
import { ArrowRight, Users, DollarSign, FileText, Clock } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome back, Valentina!</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your loans today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Loans</p>
                <p className="text-3xl font-bold mt-2">TZS 48.2M</p>
              </div>
              <DollarSign size={40} className="opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Customers</p>
                <p className="text-3xl font-bold mt-2">142</p>
              </div>
              <Users size={40} className="opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Due Today</p>
                <p className="text-3xl font-bold mt-2">TZS 1.8M</p>
              </div>
              <Clock size={40} className="opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Contracts</p>
                <p className="text-3xl font-bold mt-2">89</p>
              </div>
              <FileText size={40} className="opacity-80" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/loans/create" className="card text-center hover:scale-105 transition">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl font-bold">Create New Loan</h3>
            <p className="text-gray-600 mt-2">Issue a new loan to customer</p>
            <ArrowRight className="mx-auto mt-4 text-blue-600" />
          </Link>

          <Link href="/customers" className="card text-center hover:scale-105 transition">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold">Manage Customers</h3>
            <p className="text-gray-600 mt-2">View and edit customer profiles</p>
            <ArrowRight className="mx-auto mt-4 text-green-600" />
          </Link>

          <Link href="/payments" className="card text-center hover:scale-105 transition">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-purple-600" size={32} />
            </div>
            <h3 className="text-xl font-bold">View Payments</h3>
            <p className="text-gray-600 mt-2">Track all incoming payments</p>
            <ArrowRight className="mx-auto mt-4 text-purple-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}