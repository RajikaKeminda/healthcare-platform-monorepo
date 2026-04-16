'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  pendingVerification: number;
  totalAppointments: number;
  totalRevenue: number;
  recentAppointments: RecentAppointment[];
  recentDoctors: RecentDoctor[];
}

interface RecentAppointment {
  _id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  status: string;
  consultationFee: number;
}

interface RecentDoctor {
  _id: string;
  name: string;
  specialization: string;
  isVerified: boolean;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, doctorsRes, appointmentsRes, paymentsRes] = await Promise.allSettled([
          api.get('/api/patients/admin/patients?limit=1'),
          api.get('/api/doctors/admin/all?limit=5'),
          api.get('/api/appointments/admin/all?limit=5'),
          api.get('/api/payments/admin/all?limit=1'),
        ]);

        const patients = patientsRes.status === 'fulfilled' ? patientsRes.value : null;
        const doctors = doctorsRes.status === 'fulfilled' ? doctorsRes.value : null;
        const appointments = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value : null;
        const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value : null;

        const unverifiedRes = await api.get('/api/doctors/admin/all?verified=false&limit=1').catch(() => null);

        setStats({
          totalPatients: patients?.total || 0,
          totalDoctors: doctors?.total || 0,
          pendingVerification: unverifiedRes?.total || 0,
          totalAppointments: appointments?.total || 0,
          totalRevenue: payments?.totalRevenue || 0,
          recentAppointments: appointments?.appointments?.slice(0, 5) || [],
          recentDoctors: doctors?.doctors?.filter((d: RecentDoctor) => !d.isVerified).slice(0, 5) || [],
        });
      } catch {
        // silently handle – individual sections show their own state
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Patients',
      value: stats?.totalPatients ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'blue',
      href: '/admin/users',
    },
    {
      label: 'Total Doctors',
      value: stats?.totalDoctors ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'green',
      href: '/admin/doctors',
    },
    {
      label: 'Pending Verification',
      value: stats?.pendingVerification ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'orange',
      href: '/admin/doctors?filter=unverified',
    },
    {
      label: 'Total Appointments',
      value: stats?.totalAppointments ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'purple',
      href: '/admin/appointments',
    },
    {
      label: 'Total Revenue',
      value: stats ? `$${stats.totalRevenue.toFixed(2)}` : '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'teal',
      href: '/admin/payments',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
              {card.icon}
            </div>
            {loading ? (
              <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            )}
            <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Appointments</h2>
            <Link href="/admin/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : stats?.recentAppointments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No appointments yet</p>
            ) : (
              stats?.recentAppointments.map(apt => (
                <div key={apt._id} className="px-6 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{apt.patientName}</p>
                    <p className="text-xs text-gray-500 truncate">Dr. {apt.doctorName} · {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                      {apt.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">${apt.consultationFee}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Doctors Awaiting Verification */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Awaiting Verification</h2>
            <Link href="/admin/doctors?filter=unverified" className="text-sm text-blue-600 hover:underline">Review all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : stats?.recentDoctors.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">All doctors are verified</p>
              </div>
            ) : (
              stats?.recentDoctors.map(doc => (
                <div key={doc._id} className="px-6 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                      {doc.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500 truncate">{doc.specialization}</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/doctors?filter=unverified"
                    className="shrink-0 text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Verify Doctors', href: '/admin/doctors?filter=unverified', icon: '✅', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { label: 'Manage Patients', href: '/admin/users', icon: '👥', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { label: 'View Appointments', href: '/admin/appointments', icon: '📅', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { label: 'Financial Report', href: '/admin/payments', icon: '💰', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${action.color}`}
            >
              <span className="text-2xl">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
