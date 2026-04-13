import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Your Health, Our Priority</h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Connect with verified doctors, book appointments, and attend video consultations from the comfort of your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg text-lg">
              Get Started Free
            </Link>
            <Link href="/doctors" className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all text-lg">
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose HealthCare+?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🏥', title: 'Find Specialists', desc: 'Browse hundreds of verified doctors across all specialties.' },
            { icon: '📅', title: 'Easy Booking', desc: 'Book appointments in seconds with real-time availability.' },
            { icon: '📹', title: 'Video Consultations', desc: 'Attend secure HD video consultations from anywhere.' },
            { icon: '💊', title: 'Digital Prescriptions', desc: 'Receive and store digital prescriptions securely.' },
            { icon: '🤖', title: 'AI Symptom Checker', desc: 'Get preliminary health insights powered by AI.' },
            { icon: '🔒', title: 'Secure & Private', desc: 'Your health data is encrypted and HIPAA-compliant.' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to take control of your health?</h2>
          <p className="text-gray-600 mb-8">Join thousands of patients who trust HealthCare+ for their medical needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all">
              Register as Patient
            </Link>
            <Link href="/register?role=doctor" className="bg-white text-blue-600 border border-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all">
              Register as Doctor
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-gray-400 py-8 text-center">
        <p>&copy; 2026 HealthCare+ Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
