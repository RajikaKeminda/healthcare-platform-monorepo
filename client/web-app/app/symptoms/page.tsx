'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import Link from 'next/link';

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Fatigue', 'Sore Throat',
  'Runny Nose', 'Chest Pain', 'Shortness of Breath', 'Abdominal Pain',
  'Nausea', 'Dizziness', 'Joint Pain', 'Rash', 'Back Pain', 'Loss of Appetite'
];

interface AnalysisResult {
  possibleConditions: string[];
  recommendedSpecialties: string[];
  urgencyLevel: string;
  generalAdvice: string;
  disclaimer: string;
}

export default function SymptomCheckerPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addCustom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleCheck = async () => {
    if (selectedSymptoms.length === 0) { setError('Please select at least one symptom'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post('/api/symptoms/check', {
        symptoms: selectedSymptoms,
        additionalInfo,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
      });
      setResult(data.analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const urgencyColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    emergency: 'bg-red-600 text-white'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">AI Symptom Checker</h1>
          <p className="text-gray-500 mt-2">Get preliminary health insights based on your symptoms</p>
          <p className="text-xs text-gray-400 mt-1">⚠️ This is not a medical diagnosis. Always consult a doctor.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Your Symptoms</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_SYMPTOMS.map(s => (
              <button key={s} onClick={() => toggleSymptom(s)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${selectedSymptoms.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customSymptom} onChange={e => setCustomSymptom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Add custom symptom..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <button onClick={addCustom} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">Add</button>
          </div>
          {selectedSymptoms.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Selected: {selectedSymptoms.join(', ')}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Information (Optional)</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Age</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 30" min="1" max="120"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
            placeholder="Any additional information about your symptoms..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 text-sm" />
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

        <button onClick={handleCheck} disabled={loading || selectedSymptoms.length === 0}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mb-6 text-lg">
          {loading ? '🤖 Analyzing...' : '🔍 Check Symptoms'}
        </button>

        {result && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Analysis Results</h2>

            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${urgencyColors[result.urgencyLevel] || urgencyColors.low}`}>
              Urgency: {result.urgencyLevel?.toUpperCase()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Possible Conditions</h3>
                <ul className="space-y-2">
                  {result.possibleConditions?.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />{c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Recommended Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedSpecialties?.map((s, i) => (
                    <Link key={i} href={`/doctors?specialty=${encodeURIComponent(s)}`}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition-colors">
                      {s} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-blue-800 text-sm">{result.generalAdvice}</p>
            </div>

            <p className="text-xs text-gray-400 italic">{result.disclaimer}</p>

            <Link href="/doctors" className="mt-6 block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Find a Doctor Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
