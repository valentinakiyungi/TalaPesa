'use client';

import { useState } from 'react';
import { Building, Bell, Shield, Smartphone, Globe, Palette, User, Mail, Lock, Save } from 'lucide-react';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('TalaPesa');
  const [phone, setPhone] = useState('+255 768 000 111');
  const [email, setEmail] = useState('info@talapesa.co.tz');
  const [location, setLocation] = useState('Arusha, Tanzania');

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3">
          <Shield className="inline-block mr-4 text-blue-600" size={48} />
          Settings
        </h1>
        <p className="text-xl text-gray-600">Manage your TalaPesa business</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Building size={28} className="text-blue-600" />
              Business Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Bell size={28} className="text-purple-600" />
              Notifications
            </h2>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium">Enable Notifications</span>
              <input type="checkbox" defaultChecked className="w-6 h-6 text-blue-600 rounded" />
            </label>
          </div>

          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xl py-6 rounded-2xl shadow-2xl transition transform hover:scale-105 flex items-center justify-center gap-3">
            <Save size={28} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
