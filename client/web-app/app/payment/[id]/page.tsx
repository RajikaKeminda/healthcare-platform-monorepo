'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Appointment {
  _id: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  startTime: string;
  consultationFee: number;
  type: string;
  status: string;
  paymentStatus: string;
}

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = auth.getUser();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    const fetchAppointment = async () => {
      try {
        const data = await api.get(`/api/appointments/${id}`);
        setAppointment(data);
      } catch {
        setError('Appointment not found');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id, user, router]);

  const handlePayPal = async () => {
    if (!appointment) return;
    setProcessing(true);
    setError('');
    try {
      const data = await api.post('/api/payments/create-order', {
        appointmentId: appointment._id,
        amount: appointment.consultationFee,
        currency: 'USD',
        description: `Consultation with Dr. ${appointment.doctorName}`,
        doctorId: appointment._id,
      });
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No approval URL received');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Complete Payment</h1>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

        {appointment && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Appointment Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium">Dr. {appointment.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Specialty</span>
                <span>{appointment.doctorSpecialization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span>{appointment.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="capitalize">{appointment.type}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-blue-600">${appointment.consultationFee}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h2>
          <button onClick={handlePayPal} disabled={processing || !appointment}
            className="w-full bg-[#0070BA] text-white py-4 rounded-xl font-semibold hover:bg-[#003087] transition-colors disabled:opacity-50 flex items-center justify-center gap-3">
            {processing ? (
              <span>Redirecting to PayPal...</span>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c.013.125.027.25.034.375.376 3.76-2.15 7.21-7.26 7.21H11l-1.29 8.194h3.91c.46 0 .85-.332.92-.788l.038-.2.736-4.67.048-.254c.07-.456.46-.788.92-.788h.58c3.76 0 6.7-1.528 7.56-5.95.36-1.84.18-3.378-.7-4.588z"/>
                </svg>
                <span>Pay with PayPal</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">Secure payment powered by PayPal Sandbox</p>
        </div>
      </div>
    </div>
  );
}
