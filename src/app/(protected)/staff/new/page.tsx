'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewStaffPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/staff" className="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">Add New Staff</h1>
      </div>

      <div className="card bg-base-100 shadow max-w-2xl">
        <div className="card-body">
          <form className="space-y-4">
            <input type="text" placeholder="Full Name" className="input input-bordered w-full" />
            <input type="email" placeholder="Email" className="input input-bordered w-full" />
            <select className="select select-bordered w-full">
              <option>Admin</option>
              <option>Loan Officer</option>
              <option>Collections</option>
            </select>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-success flex-1">Create Staff</button>
              <Link href="/staff" className="btn btn-ghost flex-1">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
