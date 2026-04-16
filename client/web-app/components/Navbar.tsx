'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { auth, User } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(auth.getUser());
  }, []);

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-blue-700">HealthCare+</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/doctors" className="text-gray-600 hover:text-blue-600 transition-colors">Find Doctors</Link>
            <Link href="/symptoms" className="text-gray-600 hover:text-blue-600 transition-colors">Symptom Checker</Link>
            {user ? (
              <>
                {user.role === 'patient' && (
                  <Link href="/patient/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</Link>
                )}
                {user.role === 'doctor' && (
                  <Link href="/doctor/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</Link>
                )}
                {user.role === 'admin' && (
                  <Link href="/admin/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">Admin</Link>
                )}
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{user.name}</span>
                  <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-blue-600 hover:text-blue-800 transition-colors">Login</Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Register
                </Link>
                <Link href="/admin/login" className="text-gray-400 hover:text-gray-600 transition-colors text-xs border border-gray-200 px-2 py-1 rounded">
                  Admin
                </Link>
              </div>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link href="/doctors" className="block px-4 py-2 text-gray-600 hover:bg-gray-50">Find Doctors</Link>
            <Link href="/symptoms" className="block px-4 py-2 text-gray-600 hover:bg-gray-50">Symptom Checker</Link>
            {user ? (
              <>
                <Link
                  href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-4 py-2 text-gray-600 hover:bg-gray-50">Login</Link>
                <Link href="/register" className="block px-4 py-2 text-blue-600 hover:bg-gray-50">Register</Link>
                <Link href="/admin/login" className="block px-4 py-2 text-gray-400 hover:bg-gray-50 text-sm">Admin Portal</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
