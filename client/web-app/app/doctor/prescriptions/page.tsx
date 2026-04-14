'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  _id: string;
  patientName: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
  createdAt: string;
  validUntil: string;
}

interface Appointment {
  _id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  status: string;
}

const EMPTY_MED: Medication = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };

export default function DoctorPrescriptionsPage() {
  const router = useRouter();
  const [user] = useState(() => auth.getUser());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    appointmentId: '',
    patientId: '',
    patientName: '',
    diagnosis: '',
    notes: '',
    validUntil: '',
  });
  const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }]);

  useEffect(() => {
    if (!user || user.role !== 'doctor') { router.push('/login?role=doctor'); return; }
    Promise.all([
      api.get('/api/doctors/prescriptions/my').catch(() => []),
      api.get('/api/appointments/doctor/my').catch(() => ({ appointments: [] })),
    ]).then(([rxData, aptData]) => {
      setPrescriptions(rxData || []);
      const apts: Appointment[] = aptData.appointments || [];
      setAppointments(apts.filter(a => ['confirmed', 'completed'].includes(a.status)));
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAppointmentSelect = (aptId: string) => {
    const apt = appointments.find(a => a._id === aptId);
    if (apt) {
      setForm(f => ({ ...f, appointmentId: apt._id, patientId: apt.patientId, patientName: apt.patientName }));
    } else {
      setForm(f => ({ ...f, appointmentId: '', patientId: '', patientName: '' }));
    }
  };

  const addMed = () => setMedications(m => [...m, { ...EMPTY_MED }]);
  const removeMed = (i: number) => setMedications(m => m.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof Medication, value: string) =>
    setMedications(m => m.map((med, idx) => idx === i ? { ...med, [field]: value } : med));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.diagnosis || medications.some(m => !m.name)) {
      alert('Please fill in patient, diagnosis, and all medication names');
      return;
    }
    setSubmitting(true);
    try {
      const rx = await api.post('/api/doctors/prescriptions', {
        ...form,
        medications,
      });
      setPrescriptions(prev => [rx, ...prev]);
      setShowForm(false);
      setForm({ appointmentId: '', patientId: '', patientName: '', diagnosis: '', notes: '', validUntil: '' });
      setMedications([{ ...EMPTY_MED }]);
    } catch {
      alert('Failed to issue prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/doctor/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
            <h1 className="text-3xl font-bold text-gray-800">Prescriptions</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {showForm ? 'Cancel' : '+ Issue Prescription'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Issue New Prescription</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Patient selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Appointment</label>
                  <select value={form.appointmentId} onChange={e => handleAppointmentSelect(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— select appointment —</option>
                    {appointments.map(a => (
                      <option key={a._id} value={a._id}>
                        {a.patientName} · {new Date(a.appointmentDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                  <input value={form.patientName}
                    onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                    required placeholder="Auto-filled or enter manually"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                  <input value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                    required placeholder="Primary diagnosis"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional clinical notes" />
                </div>
              </div>

              {/* Medications */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-800">Medications *</h3>
                  <button type="button" onClick={addMed}
                    className="text-sm text-blue-600 hover:underline">+ Add medication</button>
                </div>
                <div className="space-y-3">
                  {medications.map((med, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-600">Medication {i + 1}</span>
                        {medications.length > 1 && (
                          <button type="button" onClick={() => removeMed(i)}
                            className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <input value={med.name} onChange={e => updateMed(i, 'name', e.target.value)}
                            required placeholder="Drug name *"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <input value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)}
                            placeholder="Dosage (e.g. 500mg)"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <input value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)}
                            placeholder="Frequency (e.g. twice daily)"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <input value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)}
                            placeholder="Duration (e.g. 7 days)"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <input value={med.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)}
                            placeholder="Special instructions"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Issuing…' : 'Issue Prescription'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />)}</div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">💊</div>
            <p className="text-lg">No prescriptions issued yet</p>
            <button onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:underline text-sm">Issue your first prescription →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map(rx => (
              <div key={rx._id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{rx.patientName}</h3>
                    <p className="text-blue-600 font-medium">{rx.diagnosis}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{new Date(rx.createdAt).toLocaleDateString()}</p>
                    {rx.validUntil && <p className="text-xs mt-1">Valid until {new Date(rx.validUntil).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  {rx.medications?.map((med, i) => (
                    <div key={i} className="flex flex-wrap gap-3 bg-blue-50 rounded-lg px-4 py-2 text-sm">
                      <span className="font-semibold text-blue-800">{med.name}</span>
                      {med.dosage && <span className="text-blue-600">{med.dosage}</span>}
                      {med.frequency && <span className="text-gray-600">{med.frequency}</span>}
                      {med.duration && <span className="text-gray-500">{med.duration}</span>}
                    </div>
                  ))}
                </div>
                {rx.notes && (
                  <p className="mt-3 text-sm text-gray-600 bg-yellow-50 rounded-lg px-4 py-2">
                    <strong>Notes:</strong> {rx.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
