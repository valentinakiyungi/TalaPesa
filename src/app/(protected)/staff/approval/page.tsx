
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ApprovalPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const q = query(collection(db, 'staff'), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPending(data);
      } catch (err) {
        console.error('Error fetching pending staff:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const approve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'staff', id), { status: 'active' });
      setPending(pending.filter(p => p.id !== id));
    } catch (err) {
        console.error('Error approving staff:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/staff" className="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">Pending Staff Approvals</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 text-base-content/70">
          <p className="text-lg">No pending approvals.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map((s) => (
            <div key={s.id} className="card bg-base-100 shadow hover:shadow-md transition-shadow">
              <div className="card-body flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="card-title text-lg">{s.name}</h3>
                  <p className="text-sm text-base-content/70">{s.email}</p>
                  <p className="text-sm">Role: {s.role || 'Staff'}</p>
                </div>
                <button
                  onClick={() => approve(s.id)}
                  className="btn btn-success btn-sm"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}