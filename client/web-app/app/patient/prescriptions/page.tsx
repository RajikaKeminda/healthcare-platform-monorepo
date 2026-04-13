'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  doctorName: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
  issuedAt: string;
  validUntil: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [user] = useState(() => auth.getUser());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'patient') { router.push('/login'); return; }
    api.get('/api/patients/prescriptions')
      .then(data => setPrescriptions(data || []))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Prescriptions</h1>
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />)}</div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">💊</div>
            <p>No prescriptions yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {prescriptions.map(p => (
              <div key={p._id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Dr. {p.doctorName}</h3>
                    <p className="text-blue-600 font-medium mt-1">{p.diagnosis}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Issued: {new Date(p.issuedAt).toLocaleDateString()}</p>
                    {p.validUntil && <p>Valid until: {new Date(p.validUntil).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Medications:</h4>
                  <div className="space-y-3">
                    {p.medications?.map((med, i) => (
                      <div key={i} className="bg-blue-50 rounded-lg p-3">
                        <p className="font-semibold text-blue-800">{med.name}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-blue-600 mt-1">
                          {med.dosage && <span>Dosage: {med.dosage}</span>}
                          {med.frequency && <span>Frequency: {med.frequency}</span>}
                          {med.duration && <span>Duration: {med.duration}</span>}
                        </div>
                        {med.instructions && <p className="text-sm text-gray-600 mt-1">{med.instructions}</p>}
                      </div>
                    ))}
                  </div>
                </div>
                {p.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                    <strong>Notes:</strong> {p.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
