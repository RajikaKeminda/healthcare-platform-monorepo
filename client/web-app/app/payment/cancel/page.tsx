'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 mb-8">You cancelled the payment process. Your appointment is still pending.</p>
        <Link href="/patient/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
