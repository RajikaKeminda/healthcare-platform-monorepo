'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  experience: number;
  consultationFee: number;
  rating: number;
  bio: string;
  isVerified: boolean;
  qualifications: string[];
  hospitalAffiliation: string;
  availability: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', reason: '', type: 'telemedicine' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const data = await api.get(`/api/doctors/${id}`);
        setDoctor(data);
      } catch {
        setError('Doctor not found');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.isAuthenticated()) { router.push('/login'); return; }
    const user = auth.getUser();
    if (user?.role !== 'patient') { setError('Only patients can book appointments'); return; }
    setBooking(true);
    setError('');
    try {
      await api.post('/api/appointments', {
        doctorId: doctor?._id,
        doctorName: doctor?.name,
        doctorSpecialization: doctor?.specialization,
        appointmentDate: form.date,
        startTime: form.time,
        type: form.type,
        reason: form.reason,
        consultationFee: doctor?.consultationFee,
      });
      setMessage('Appointment booked successfully!');
      setTimeout(() => router.push(`/patient/dashboard`), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    </div>
  );

  if (!doctor) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="text-center py-16 text-gray-500">Doctor not found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">👨‍⚕️</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Dr. {doctor.name}</h1>
                  <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                  {doctor.isVerified && <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">✓ Verified Doctor</span>}
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <span>🎓 {doctor.experience || 0} yrs exp</span>
                    <span>⭐ {doctor.rating?.toFixed(1) || '4.5'}</span>
                    <span>💰 ${doctor.consultationFee}</span>
                  </div>
                </div>
              </div>
              {doctor.bio && <p className="text-gray-600 mt-4">{doctor.bio}</p>}
              {doctor.hospitalAffiliation && <p className="text-gray-500 text-sm mt-2">🏥 {doctor.hospitalAffiliation}</p>}
              {doctor.qualifications?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Qualifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.qualifications.map((q, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full">{q}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {doctor.availability?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Availability</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {doctor.availability.filter(a => a.isAvailable).map((slot, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="font-medium text-blue-800 text-sm">{DAYS[slot.dayOfWeek]}</p>
                      <p className="text-blue-600 text-xs">{slot.startTime} - {slot.endTime}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 h-fit sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Book Appointment</h2>
            {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{message}</div>}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="telemedicine">📹 Telemedicine</option>
                  <option value="in-person">🏥 In-Person</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  placeholder="Describe your symptoms..." />
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Consultation Fee</span>
                  <span className="font-semibold text-gray-800">${doctor.consultationFee}</span>
                </div>
              </div>
              <button type="submit" disabled={booking}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                {booking ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
