'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Appointment {
  _id: string;
  patientName: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  type: string;
  reason: string;
  consultationFee: number;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const user = auth.getUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'today' | 'upcoming' | 'past'>('today');

  useEffect(() => {
    if (!user || user.role !== 'doctor') { router.push('/login?role=doctor'); return; }
    const fetchAppointments = async () => {
      try {
        const data = await api.get('/api/appointments/doctor/my');
        setAppointments(data.appointments || []);
      } catch { setAppointments([]); }
      finally { setLoading(false); }
    };
    fetchAppointments();
  }, [user, router]);

  const today = new Date().toDateString();
  const todayApts = appointments.filter(a => new Date(a.appointmentDate).toDateString() === today && ['pending', 'confirmed'].includes(a.status));
  const upcoming = appointments.filter(a => new Date(a.appointmentDate) > new Date() && ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  const displayed = tab === 'today' ? todayApts : tab === 'upcoming' ? upcoming : past;

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/appointments/${id}/status`, { status });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Doctor Dashboard</h1>
          <p className="text-gray-500">Welcome, Dr. {user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Appointments", value: todayApts.length, icon: '📅' },
            { label: 'Pending Approval', value: appointments.filter(a => a.status === 'pending').length, icon: '⏳' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, icon: '✅' },
            { label: 'Total Patients', value: new Set(appointments.map(a => a.patientName)).size, icon: '👥' },
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
              <div className="p-6 border-b border-gray-100">
                <div className="flex gap-2">
                  {(['today', 'upcoming', 'past'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {t} ({t === 'today' ? todayApts.length : t === 'upcoming' ? upcoming.length : past.length})
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
                ) : displayed.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-3">📋</div>
                    <p>No appointments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayed.map(apt => (
                      <div key={apt._id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{apt.patientName}</h3>
                            <p className="text-gray-500 text-sm">📅 {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.startTime}</p>
                            {apt.reason && <p className="text-gray-600 text-sm mt-1">📝 {apt.reason}</p>}
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColor(apt.status)}`}>{apt.status}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{apt.type}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {apt.status === 'pending' && (
                              <>
                                <button onClick={() => updateStatus(apt._id, 'confirmed')}
                                  className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">
                                  Confirm
                                </button>
                                <button onClick={() => updateStatus(apt._id, 'cancelled')}
                                  className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200">
                                  Reject
                                </button>
                              </>
                            )}
                            {apt.status === 'confirmed' && (
                              <>
                                {apt.type === 'telemedicine' && (
                                  <Link href={`/session/${apt._id}`}
                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                                    Start Session
                                  </Link>
                                )}
                                <button onClick={() => updateStatus(apt._id, 'completed')}
                                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200">
                                  Mark Done
                                </button>
                              </>
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
                <Link href="/doctor/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 text-sm">
                  <span>👤</span> Edit Profile
                </Link>
                <Link href="/doctor/availability" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 text-sm">
                  <span>📅</span> Set Availability
                </Link>
                <Link href="/doctor/prescriptions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 text-sm">
                  <span>💊</span> Prescriptions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
