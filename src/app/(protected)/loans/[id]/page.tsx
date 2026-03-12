'use client';

/**
 * IMPORTANT: Force dynamic rendering
 * This page uses real-time Firebase data and dynamic [id] param
 * We don't want static pre-rendering for this route
 */
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function LoanDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Hakuna ID ya mkopo iliyotolewa.');
      setLoading(false);
      return;
    }

    const fetchLoan = async () => {
      try {
        const docRef = doc(db, 'loans', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setLoan({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Mkopo haujapatikana.');
        }
      } catch (err: any) {
        console.error('Error fetching loan:', err);
        setError('Hitilafu wakati wa kupakia maelezo ya mkopo.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
        Inapakia maelezo ya mkopo...
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-xl max-w-lg mx-auto">
          <p className="text-xl font-medium">{error || 'Mkopo haujapatikana.'}</p>
          <Link
            href="/loans"
            className="mt-6 inline-block text-blue-600 hover:text-blue-800 font-medium underline"
          >
            Rudi kwenye Orodha ya Mikopo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <Link
          href="/loans"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          <ArrowLeft size={18} />
          Mikopo Yote
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">Maelezo ya Mkopo </h1>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8 border border-gray-200">
        {/* Customer + Guarantor */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">
              Taarifa za Mteja
            </h2>
            <div className="space-y-3 text-gray-800">
              <p><strong>Jina:</strong> {loan.customerName || '-'}</p>
              <p><strong>Simu:</strong> {loan.customerPhone || '-'}</p>
              <p><strong>Namba ya Kitambulisho:</strong> {loan.customerIdNumber || '-'}</p>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">
              Taarifa za Mdhamini
            </h2>
            <div className="space-y-3 text-gray-800">
              <p><strong>Jina:</strong> {loan.guarantorName || '-'}</p>
              <p><strong>Simu:</strong> {loan.guarantorPhone || '-'}</p>
              <p><strong>Uhusiano:</strong> {loan.guarantorRelation || '-'}</p>
              <p><strong>Namba ya Kitambulisho:</strong> {loan.guarantorIdNumber || '-'}</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Loan Details */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-green-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              Maelezo ya Mkopo
            </h2>
            <div className="space-y-3 text-gray-800">
              <p><strong>Kiasi:</strong> TZS {loan.principal?.toLocaleString() || '-'}</p>
              <p><strong>Muda:</strong> {loan.loanDuration || '-'} miezi</p>
              <p><strong>Jumla ya Kulipa:</strong> TZS {loan.totalAmount?.toLocaleString() || '-'}</p>
              <p><strong>Malipo ya Mwezi:</strong> TZS {loan.monthlyPayment?.toLocaleString() || '-'}</p>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-orange-800">
              Hali ya Mkopo
            </h2>
            <div className="space-y-3 text-gray-800">
              <p className="mb-2">
                <strong>Hali:</strong>{' '}
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                    loan.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : loan.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : loan.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {loan.status === 'active'
                    ? 'Hai'
                    : loan.status === 'overdue'
                    ? 'Imechelewa'
                    : loan.status === 'pending'
                    ? 'Inasubiri'
                    : loan.status || 'N/A'}
                </span>
              </p>

              <p><strong>Salio Linalobaki:</strong> TZS {loan.balanceDue?.toLocaleString() || '-'}</p>
              <p>
                <strong>Tarehe ya Usajili:</strong>{' '}
                {loan.createdAt?.toDate?.()?.toLocaleString('sw-TZ') || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}