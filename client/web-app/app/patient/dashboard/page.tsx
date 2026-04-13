'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Appointment {
  _id: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  type: string;
  consultationFee: number;
  paymentStatus: string;
  meetingId: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const user = auth.getUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!user || user.role !== 'patient') { router.push('/login'); return; }
    const fetchAppointments = async () => {
      try {
        const data = await api.get('/api/appointments/patient/my');
        setAppointments(data.appointments || []);
      } catch { setAppointments([]); }
      finally { setLoading(false); }
    };
    fetchAppointments();
  }, [user, router]);

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled', 'no-show'].includes(a.status));
  const displayed = tab === 'upcoming' ? upcoming : past;

  const statusColor = (s: string) => ({
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700'
  }[s] || 'bg-gray-100 text-gray-700');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Appointments', value: appointments.length, icon: '📅', color: 'blue' },
            { label: 'Upcoming', value: upcoming.length, icon: '⏰', color: 'green' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, icon: '✅', color: 'purple' },
            { label: 'Pending Payment', value: appointments.filter(a => a.paymentStatus === 'pending' && a.status !== 'cancelled').length, icon: '💳', color: 'orange' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex gap-2">
                  {(['upcoming', 'past'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {t} ({t === 'upcoming' ? upcoming.length : past.length})
                    </button>
                  ))}
                </div>
                <Link href="/doctors" className="text-blue-600 text-sm hover:underline">+ Book New</Link>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
                ) : displayed.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-3">📋</div>
                    <p>No {tab} appointments</p>
                    {tab === 'upcoming' && (
                      <Link href="/doctors" className="text-blue-600 hover:underline text-sm mt-2 block">
                        Book your first appointment →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayed.map(apt => (
                      <div key={apt._id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">Dr. {apt.doctorName}</h3>
                            <p className="text-blue-600 text-sm">{apt.doctorSpecialization}</p>
                            <p className="text-gray-500 text-sm mt-1">
                              📅 {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.startTime}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColor(apt.status)}`}>{apt.status}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{apt.type}</span>
                              {apt.paymentStatus === 'pending' && apt.status !== 'cancelled' && (
                                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">💳 Payment Pending</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className="font-semibold text-gray-700">${apt.consultationFee}</span>
                            {apt.status === 'confirmed' && apt.type === 'telemedicine' && (
                              <Link href={`/session/${apt._id}`}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors">
                                Join Session
                              </Link>
                            )}
                            {apt.paymentStatus === 'pending' && apt.status !== 'cancelled' && (
                              <Link href={`/payment/${apt._id}`}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                                Pay Now
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/doctors" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm">
                  <span className="text-xl">🔍</span> Find Doctors
                </Link>
                <Link href="/symptoms" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm">
                  <span className="text-xl">🤖</span> Symptom Checker
                </Link>
                <Link href="/patient/reports" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm">
                  <span className="text-xl">📁</span> My Reports
                </Link>
                <Link href="/patient/prescriptions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm">
                  <span className="text-xl">💊</span> Prescriptions
                </Link>
                <Link href="/patient/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm">
                  <span className="text-xl">👤</span> Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
