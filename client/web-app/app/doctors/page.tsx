'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  experience: number;
  consultationFee: number;
  rating: number;
  bio: string;
  isVerified: boolean;
}

const SPECIALIZATIONS = [
  'All', 'Cardiology', 'Dermatology', 'General Practice', 'Neurology',
  'Pediatrics', 'Psychiatry', 'Orthopedics', 'Gynecology', 'Pulmonology', 'ENT'
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('name', search);
      if (specialty !== 'All') params.append('specialty', specialty);
      const data = await api.get(`/api/doctors/search?${params}`);
      setDoctors(data.doctors || []);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [search, specialty]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Find a Doctor</h1>
        <p className="text-gray-500 mb-8">Browse our verified healthcare professionals</p>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input type="text" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={specialty} onChange={e => setSpecialty(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-64">
            {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <p className="text-xl">No doctors found. Try different search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doctor => (
              <div key={doctor._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">👨‍⚕️</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Dr. {doctor.name}</h3>
                    <p className="text-blue-600 text-sm">{doctor.specialization}</p>
                    {doctor.isVerified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>🎓 {doctor.experience || 0} years experience</p>
                  <p>⭐ {doctor.rating?.toFixed(1) || '4.5'} rating</p>
                  <p>💰 ${doctor.consultationFee} consultation fee</p>
                </div>
                {doctor.bio && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{doctor.bio}</p>}
                <Link href={`/doctors/${doctor._id}`}
                  className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Book Appointment
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
