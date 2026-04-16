'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Payment {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
};

type StatusFilter = 'all' | 'pending' | 'completed' | 'failed';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await api.get(`/api/payments/admin/all?${params}`);
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      if (data.totalRevenue !== undefined) setTotalRevenue(data.totalRevenue);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleFilterChange = (s: StatusFilter) => {
    setStatusFilter(s);
    setPage(1);
  };

  const completedPayments = payments.filter(p => p.status === 'completed');
  const pageRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  const statusTabs: { label: string; value: StatusFilter }[] = [
    { label: 'All Transactions', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Financial Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">Payment history and revenue overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {loading ? (
            <div className="h-7 w-28 bg-gray-200 rounded animate-pulse mb-1" />
          ) : (
            <div className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</div>
          )}
          <div className="text-sm text-gray-500">Total Revenue</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-1" />
          ) : (
            <div className="text-2xl font-bold text-gray-900">{total}</div>
          )}
          <div className="text-sm text-gray-500">Total Transactions</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {loading ? (
            <div className="h-7 w-20 bg-gray-200 rounded animate-pulse mb-1" />
          ) : (
            <div className="text-2xl font-bold text-gray-900">${pageRevenue.toFixed(2)}</div>
          )}
          <div className="text-sm text-gray-500">This Page Revenue</div>
        </div>
      </div>

      {/* Filter Tabs */}
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
                <th className="px-6 py-3 font-semibold text-gray-600">Transaction ID</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Appointment</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Description</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600">PayPal Order</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Date</th>
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
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-500">
                        {payment._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-500">
                        {payment.appointmentId?.slice(-8).toUpperCase() || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                      {payment.description || 'Consultation payment'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${payment.amount.toFixed(2)}
                      <span className="text-xs font-normal text-gray-400 ml-1">{payment.currency}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[payment.status] || 'bg-gray-100 text-gray-600'}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-400 truncate max-w-[120px] block">
                        {payment.paypalOrderId ? payment.paypalOrderId.slice(0, 16) + '…' : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
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
