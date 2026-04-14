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

function buildPrintHTML(rx: Prescription, patientName: string): string {
  const medsRows = (rx.medications ?? [])
    .map(
      (m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${m.name}</strong></td>
        <td>${m.dosage || '—'}</td>
        <td>${m.frequency || '—'}</td>
        <td>${m.duration || '—'}</td>
        <td>${m.instructions || '—'}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Prescription – ${rx.diagnosis}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
    .header-left h1 { font-size: 22px; color: #2563eb; }
    .header-left p { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .header-right { text-align: right; font-size: 13px; color: #374151; }
    .header-right .rx-symbol { font-size: 36px; color: #2563eb; font-weight: bold; line-height: 1; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f0f7ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .meta-item label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; display: block; margin-bottom: 2px; }
    .meta-item span { font-size: 14px; font-weight: 600; color: #111827; }
    h2 { font-size: 15px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .04em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    thead tr { background: #2563eb; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    .notes { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400e; margin-bottom: 24px; }
    .notes strong { display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 8px; font-size: 12px; color: #6b7280; }
    .signature-line { border-top: 1px solid #374151; padding-top: 6px; min-width: 180px; text-align: center; font-size: 12px; color: #374151; margin-top: 40px; }
    @media print {
      body { padding: 20px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Medical Prescription</h1>
      <p>HealthCare Platform – Official Prescription Document</p>
    </div>
    <div class="header-right">
      <div class="rx-symbol">℞</div>
      <p style="margin-top:6px;">Date: ${new Date(rx.issuedAt).toLocaleDateString()}</p>
      ${rx.validUntil ? `<p>Valid until: ${new Date(rx.validUntil).toLocaleDateString()}</p>` : ''}
    </div>
  </div>

  <div class="meta">
    <div class="meta-item">
      <label>Patient</label>
      <span>${patientName}</span>
    </div>
    <div class="meta-item">
      <label>Prescribing Doctor</label>
      <span>Dr. ${rx.doctorName}</span>
    </div>
    <div class="meta-item" style="grid-column:1/-1;">
      <label>Diagnosis</label>
      <span>${rx.diagnosis}</span>
    </div>
  </div>

  <h2>Prescribed Medications</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Drug Name</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Instructions</th>
      </tr>
    </thead>
    <tbody>${medsRows}</tbody>
  </table>

  ${rx.notes ? `<div class="notes"><strong>Doctor's Notes</strong>${rx.notes}</div>` : ''}

  <div class="footer">
    <div>
      <p>This prescription was issued electronically via HealthCare Platform.</p>
      <p>For verification, contact your healthcare provider.</p>
    </div>
    <div class="signature-line">
      Dr. ${rx.doctorName}<br/>Authorized Signature
    </div>
  </div>

  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;
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

  const downloadPrescription = (rx: Prescription) => {
    const html = buildPrintHTML(rx, user?.name ?? 'Patient');
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow pop-ups to download the prescription.'); return; }
    win.document.write(html);
    win.document.close();
  };

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
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right text-sm text-gray-500">
                      <p>Issued: {new Date(p.issuedAt).toLocaleDateString()}</p>
                      {p.validUntil && <p>Valid until: {new Date(p.validUntil).toLocaleDateString()}</p>}
                    </div>
                    <button
                      onClick={() => downloadPrescription(p)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      Download PDF
                    </button>
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
