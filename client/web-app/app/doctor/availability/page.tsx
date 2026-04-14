'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SLOTS: AvailabilitySlot[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: '09:00',
  endTime: '17:00',
  isAvailable: i >= 1 && i <= 5, // Mon–Fri on by default
}));

export default function DoctorAvailabilityPage() {
  const router = useRouter();
  const [user] = useState(() => auth.getUser());
  const [slots, setSlots] = useState<AvailabilitySlot[]>(DEFAULT_SLOTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'doctor') { router.push('/login?role=doctor'); return; }
    api.get('/api/doctors/profile/me')
      .then(data => {
        if (data.availability && data.availability.length > 0) {
          // Merge server availability into the full 7-day structure
          const merged = DEFAULT_SLOTS.map(def => {
            const server = (data.availability as AvailabilitySlot[]).find(s => s.dayOfWeek === def.dayOfWeek);
            return server ? { ...def, ...server } : def;
          });
          setSlots(merged);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (day: number, field: keyof AvailabilitySlot, value: string | boolean) =>
    setSlots(prev => prev.map(s => s.dayOfWeek === day ? { ...s, [field]: value } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/doctors/availability', { availability: slots });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/doctor/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <h1 className="text-3xl font-bold text-gray-800">Set Availability</h1>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
          Toggle each day on or off and set your working hours. Patients can only book appointments during your available slots.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">On</div>
              <div className="col-span-3">Day</div>
              <div className="col-span-4">Start Time</div>
              <div className="col-span-4">End Time</div>
            </div>
            {slots.map(slot => (
              <div key={slot.dayOfWeek}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 transition-colors ${slot.isAvailable ? '' : 'opacity-50'}`}>
                <div className="col-span-1">
                  <button type="button"
                    onClick={() => update(slot.dayOfWeek, 'isAvailable', !slot.isAvailable)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${slot.isAvailable ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${slot.isAvailable ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
                <div className="col-span-3">
                  <span className={`font-medium ${slot.isAvailable ? 'text-gray-800' : 'text-gray-400'}`}>
                    {DAYS[slot.dayOfWeek]}
                  </span>
                </div>
                <div className="col-span-4">
                  <input type="time" value={slot.startTime}
                    onChange={e => update(slot.dayOfWeek, 'startTime', e.target.value)}
                    disabled={!slot.isAvailable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-400" />
                </div>
                <div className="col-span-4">
                  <input type="time" value={slot.endTime}
                    onChange={e => update(slot.dayOfWeek, 'endTime', e.target.value)}
                    disabled={!slot.isAvailable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Availability'}
            </button>
            {saved && <span className="text-green-600 font-medium">✓ Availability saved!</span>}
            <Link href="/doctor/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
