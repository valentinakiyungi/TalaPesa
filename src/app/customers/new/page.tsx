
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCustomerPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const newCustomer = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date().toISOString(),
      };
      customers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(customers));

      router.push('/customers');
    } catch (error) {
      alert('Failed to save customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add New Customer</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Full Name</span>
          </label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input input-bordered w-full"
            required
            disabled={loading}
          />
        </div>

        {/* Phone */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Phone Number</span>
          </label>
          <input
            type="tel"
            placeholder="e.g. 0712345678"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input input-bordered w-full"
            required
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Email (Optional)</span>
          </label>
          <input
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input input-bordered w-full"
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-success flex-1"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>
                Saving...
              </>
            ) : (
              'Save Customer'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/customers')}
            className="btn btn-ghost flex-1"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}