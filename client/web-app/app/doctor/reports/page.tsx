'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Report {
  _id: string;
  title: string;
  description: string;
  reportType: string;
  reportDate: string;
  doctorName: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface Patient {
  id: string;
  name: string;
}

interface Appointment {
  _id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  lab_result: '🧪 Lab Result',
  radiology: '🩻 Radiology',
  prescription: '💊 Prescription',
  other: '📄 Other',
};

export default function DoctorReportsPage() {
  const router = useRouter();
  const [user] = useState(() => auth.getUser());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'doctor') { router.push('/login?role=doctor'); return; }
    api.get('/api/appointments/doctor/my')
      .then((data: { appointments?: Appointment[] }) => {
        const apts: Appointment[] = data.appointments || [];
        // Deduplicate patients from appointments
        const map = new Map<string, string>();
        apts.forEach(a => { if (a.patientId && a.patientName) map.set(a.patientId, a.patientName); });
        setPatients(Array.from(map.entries()).map(([id, name]) => ({ id, name })));
      })
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoadingReports(true);
    setReports([]);
    try {
      const data = await api.get(`/api/patients/${patient.id}/reports`);
      setReports(Array.isArray(data) ? data : []);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/doctor/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <h1 className="text-3xl font-bold text-gray-800">Patient Medical Reports</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">My Patients</h2>
              <p className="text-xs text-gray-400 mt-1">Select a patient to view their reports</p>
            </div>
            <div className="p-3">
              {loadingPatients ? (
                <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : patients.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm">No patients yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {patients.map(p => (
                    <button key={p.id} onClick={() => selectPatient(p)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                        selectedPatient?.id === p.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        selectedPatient?.id === p.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-sm truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reports panel */}
          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="text-5xl mb-4">📂</div>
                <p className="text-lg font-medium">Select a patient</p>
                <p className="text-sm mt-1">Choose a patient from the left to view their uploaded medical reports</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">
                    Reports for <span className="text-blue-600">{selectedPatient.name}</span>
                  </h2>
                </div>
                <div className="p-5">
                  {loadingReports ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-3">📁</div>
                      <p>No reports uploaded by this patient</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map(r => (
                        <div key={r._id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-800">{r.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{TYPE_LABELS[r.reportType] || r.reportType}</p>
                              {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                              {r.doctorName && (
                                <p className="text-xs text-gray-400 mt-1">Attending doctor: {r.doctorName}</p>
                              )}
                            </div>
                            <div className="text-right text-xs text-gray-400 ml-4 shrink-0">
                              <p>{new Date(r.uploadedAt || r.reportDate || '').toLocaleDateString()}</p>
                              {r.fileName && (
                                <p className="mt-1 text-gray-500">📎 {r.fileName}</p>
                              )}
                              {r.fileUrl && (
                                <a
                                  href={`${API_BASE}${r.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block text-blue-600 hover:underline text-xs font-medium"
                                >
                                  View File ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
