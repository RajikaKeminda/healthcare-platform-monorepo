'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Appointment {
  _id: string;
  patientName: string;
  doctorName: string;
  doctorSpecialization?: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  type: string;
  consultationFee: number;
  paymentStatus: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-gray-100 text-gray-600',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-purple-100 text-purple-700',
};

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await api.get(`/api/appointments/admin/all?${params}`);
      setAppointments(data.appointments || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleFilterChange = (s: StatusFilter) => {
    setStatusFilter(s);
    setPage(1);
  };

  const statusTabs: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 text-sm mt-1">
          {total} total appointment{total !== 1 ? 's' : ''} on the platform
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6 flex-wrap">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-6 py-3 font-semibold text-gray-600">Patient</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Doctor</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Date & Time</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Type</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Fee</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map(apt => (
                  <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{apt.patientName}</td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800">Dr. {apt.doctorName}</p>
                      {apt.doctorSpecialization && (
                        <p className="text-xs text-gray-400">{apt.doctorSpecialization}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>{new Date(apt.appointmentDate).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{apt.startTime}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        apt.type === 'telemedicine'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">${apt.consultationFee}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_COLORS[apt.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {apt.paymentStatus || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))
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
