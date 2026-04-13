'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Report {
  _id: string;
  title: string;
  description: string;
  reportType: string;
  reportDate: string;
  doctorName: string;
  fileName: string;
  uploadedAt: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const user = auth.getUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', reportType: 'other', doctorName: '', reportDate: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'patient') { router.push('/login'); return; }
    api.get('/api/patients/reports')
      .then(data => setReports(data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const token = auth.getToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_BASE}/api/patients/reports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const report = await res.json();
      setReports(prev => [report, ...prev]);
      setShowForm(false);
      setForm({ title: '', description: '', reportType: 'other', doctorName: '', reportDate: '' });
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const typeLabels: Record<string, string> = {
    lab_result: '🧪 Lab Result',
    radiology: '🩻 Radiology',
    prescription: '💊 Prescription',
    other: '📄 Other'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Medical Reports</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {showForm ? 'Cancel' : '+ Upload Report'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold mb-4">Upload New Report</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Blood Test Results" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select value={form.reportType} onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                  <input value={form.doctorName} onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                  <input type="date" value={form.reportDate} onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20" />
              </div>
              <button type="submit" disabled={uploading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload Report'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📁</div>
            <p>No reports uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r._id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{r.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{typeLabels[r.reportType] || r.reportType}</p>
                    {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                    {r.doctorName && <p className="text-xs text-gray-400 mt-1">By: {r.doctorName}</p>}
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>{new Date(r.uploadedAt || r.reportDate || '').toLocaleDateString()}</p>
                    {r.fileName && <p className="mt-1">📎 {r.fileName}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
