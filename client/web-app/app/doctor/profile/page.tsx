'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface DoctorProfile {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string[];
  experience: number | string;
  consultationFee: number | string;
  bio: string;
  licenseNumber: string;
  hospitalAffiliation: string;
}

const EMPTY: DoctorProfile = {
  name: '', email: '', phone: '', specialization: '',
  qualifications: [], experience: '', consultationFee: '',
  bio: '', licenseNumber: '', hospitalAffiliation: '',
};

export default function DoctorProfilePage() {
  const router = useRouter();
  const [user] = useState(() => auth.getUser());
  const [profile, setProfile] = useState<DoctorProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qualInput, setQualInput] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'doctor') { router.push('/login?role=doctor'); return; }
    api.get('/api/doctors/profile/me')
      .then(data => {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialization: data.specialization || '',
          qualifications: data.qualifications || [],
          experience: data.experience ?? '',
          consultationFee: data.consultationFee ?? '',
          bio: data.bio || '',
          licenseNumber: data.licenseNumber || '',
          hospitalAffiliation: data.hospitalAffiliation || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/doctors/profile/me', {
        ...profile,
        experience: Number(profile.experience) || 0,
        consultationFee: Number(profile.consultationFee) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addQual = () => {
    const trimmed = qualInput.trim();
    if (trimmed && !profile.qualifications.includes(trimmed)) {
      setProfile(p => ({ ...p, qualifications: [...p.qualifications, trimmed] }));
    }
    setQualInput('');
  };

  const removeQual = (q: string) =>
    setProfile(p => ({ ...p, qualifications: p.qualifications.filter(x => x !== q) }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
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
          <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={profile.email} readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 234 567 8900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                <input value={profile.specialization} onChange={e => setProfile(p => ({ ...p, specialization: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cardiology, General Practice…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input type="number" min="0" value={profile.experience}
                  onChange={e => setProfile(p => ({ ...p, experience: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
                <input type="number" min="0" step="0.01" value={profile.consultationFee}
                  onChange={e => setProfile(p => ({ ...p, consultationFee: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input value={profile.licenseNumber} onChange={e => setProfile(p => ({ ...p, licenseNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Affiliation</label>
                <input value={profile.hospitalAffiliation} onChange={e => setProfile(p => ({ ...p, hospitalAffiliation: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief professional bio…" />
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Qualifications &amp; Degrees</h2>
            <div className="flex gap-2 mb-3">
              <input value={qualInput} onChange={e => setQualInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQual(); } }}
                placeholder="e.g. MBBS, MD, FRCS"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <button type="button" onClick={addQual}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.qualifications.length === 0 && <p className="text-sm text-gray-400">No qualifications added</p>}
              {profile.qualifications.map(q => (
                <span key={q} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                  {q}
                  <button type="button" onClick={() => removeQual(q)} className="ml-1 hover:text-blue-900 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && <span className="text-green-600 font-medium">✓ Profile saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
