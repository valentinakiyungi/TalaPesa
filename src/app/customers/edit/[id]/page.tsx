'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Customer } from '@/types/customer';
import { useRouter } from 'next/navigation';

export default function EditCustomer({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    address: '',
    financialHistory: {
      creditScore: 0,
      previousLoans: [],
    },
    documentUrls: [],
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const customerDoc = await getDoc(doc(db, 'customers', params.id));
        if (customerDoc.exists()) {
          const data = customerDoc.data() as Customer;
          setFormData({
            ...data,
            financialHistory: {
              creditScore: data.financialHistory?.creditScore ?? 0,
              previousLoans: data.financialHistory?.previousLoans ?? [],
            },
          });
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    };
    fetchCustomer();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let documentUrls = formData.documentUrls || [];
      if (file) {
        const storageRef = ref(storage, `customers/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        documentUrls = [...documentUrls, url];
      }

      await updateDoc(doc(db, 'customers', params.id), {
        ...formData,
        documentUrls,
        financialHistory: {
          ...formData.financialHistory,
          previousLoans: formData.financialHistory?.previousLoans ?? [],
        },
      });

      router.push(`/customers/${params.id}`);
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      financialHistory: {
        creditScore: prev.financialHistory?.creditScore ?? 0,
        previousLoans: prev.financialHistory?.previousLoans ?? [],
        [name]:
          name === 'creditScore'
            ? Number(value) || 0
            : value.split(',').map((id) => id.trim()).filter(Boolean),
      },
    }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Edit Customer</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="ID Number"
          value={formData.idNumber || ''}
          onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        <textarea
          placeholder="Address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500"
        />

        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-lg">Financial History</h3>
          <input
            type="number"
            name="creditScore"
            placeholder="Credit Score"
            value={formData.financialHistory?.creditScore ?? 0}
            onChange={handleFinancialChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="previousLoans"
            placeholder="Previous Loans (comma-separated IDs)"
            value={(formData.financialHistory?.previousLoans ?? []).join(', ')}
            onChange={handleFinancialChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full p-3 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Updating...' : 'Update Customer'}
        </button>
      </form>
    </div>
  );
}