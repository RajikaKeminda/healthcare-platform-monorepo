'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  consultationFee?: number;
  experience?: number;
  createdAt: string;
}

type FilterType = 'all' | 'unverified' | 'verified';

function AdminDoctorsContent() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as FilterType) || 'all';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'toggle' | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filter === 'unverified') params.set('verified', 'false');
      if (filter === 'verified') params.set('verified', 'true');
      const data = await api.get(`/api/doctors/admin/all?${params}`);
      setDoctors(data.doctors || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const verifyDoctor = async (id: string) => {
    setActionId(id);
    setActionType('verify');
    try {
      await api.put(`/api/doctors/admin/${id}/verify`, {});
      setDoctors(prev =>
        prev.map(d => d._id === id ? { ...d, isVerified: true } : d)
      );
    } catch {
      // silently handle
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  const toggleDoctorStatus = async (id: string) => {
    setActionId(id);
    setActionType('toggle');
    try {
      await api.put(`/api/doctors/admin/${id}/toggle-status`, {});
      setDoctors(prev =>
        prev.map(d => d._id === id ? { ...d, isActive: !d.isActive } : d)
      );
    } catch {
      // silently handle
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: 'All Doctors', value: 'all' },
    { label: 'Pending Verification', value: 'unverified' },
    { label: 'Verified', value: 'verified' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Verify registrations and manage doctor accounts
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
            {filter === tab.value && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-6 py-3 font-semibold text-gray-600">Doctor</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Specialization</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Experience</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Fee</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Joined</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Verification</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    {filter === 'unverified'
                      ? 'No doctors pending verification.'
                      : 'No doctors found.'}
                  </td>
                </tr>
              ) : (
                doctors.map(doctor => {
                  const isActing = actionId === doctor._id;
                  return (
                    <tr key={doctor._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                            {doctor.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-xs text-gray-400">{doctor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{doctor.specialization || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {doctor.experience ? `${doctor.experience} yr${doctor.experience !== 1 ? 's' : ''}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {doctor.consultationFee ? `$${doctor.consultationFee}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(doctor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {doctor.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doctor.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${doctor.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!doctor.isVerified && (
                            <button
                              onClick={() => verifyDoctor(doctor._id)}
                              disabled={isActing}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {isActing && actionType === 'verify' ? 'Verifying…' : 'Verify'}
                            </button>
                          )}
                          <button
                            onClick={() => toggleDoctorStatus(doctor._id)}
                            disabled={isActing}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                              doctor.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {isActing && actionType === 'toggle'
                              ? 'Saving…'
                              : doctor.isActive
                              ? 'Suspend'
                              : 'Reinstate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {pages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDoctorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading…</div>}>
      <AdminDoctorsContent />
    </Suspense>
  );
}
