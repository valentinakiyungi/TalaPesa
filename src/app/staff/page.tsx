
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { UserPlus, Search } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      const q = query(collection(db, 'staff'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(data);
      setLoading(false);
    };
    fetchStaff();
  }, []);

  const filtered = staff
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => filter === 'all' || s.status === filter);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <Link href="/staff/new" className="btn btn-primary">
          <UserPlus size={18} className="mr-2" />
          Add Staff
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-base-content/50" />
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="select select-bordered"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="card bg-base-100 shadow hover:shadow-lg">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="card-title text-lg">{s.name}</h3>
                    <p className="text-sm text-base-content/70">{s.role}</p>
                    <p className="text-sm">{s.email}</p>
                  </div>
                  <span className={`badge badge-sm ${s.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {s.status}
                  </span>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-sm btn-ghost">Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}