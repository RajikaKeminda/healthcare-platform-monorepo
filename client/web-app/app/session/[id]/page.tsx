'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

declare global {
  interface Window {
    AgoraRTC: {
      createClient: (config: { mode: string; codec: string }) => AgoraClient;
    };
  }
}

interface AgoraClient {
  join: (appId: string, channel: string, token: string | null, uid: number) => Promise<number>;
  publish: (tracks: AgoraTrack[]) => Promise<void>;
  subscribe: (user: { uid: number }, mediaType: string) => Promise<void>;
  leave: () => Promise<void>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface AgoraTrack {
  play: (element: string | HTMLElement) => void;
  close: () => void;
}

export default function VideoSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = auth.getUser();
  const [sessionData, setSessionData] = useState<{ token: string; appId: string; channelName: string; uid: number } | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const clientRef = useRef<AgoraClient | null>(null);
  const localTracksRef = useRef<AgoraTrack[]>([]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    const fetchSession = async () => {
      try {
        const data = await api.post(`/api/sessions/${id}/join`, {});
        setSessionData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id, user, router]);

  const joinCall = async () => {
    if (!sessionData || !window.AgoraRTC) {
      setError('Agora SDK not loaded. Please check your App ID configuration.');
      return;
    }
    try {
      const client = window.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (...args: unknown[]) => {
        const remoteUser = args[0];
        const mediaType = args[1] as string;
        const u = remoteUser as { uid: number };
        await client.subscribe(u, mediaType);
        if (mediaType === 'video') {
          const remoteTrack = (u as unknown as { videoTrack: AgoraTrack }).videoTrack;
          remoteTrack?.play('remote-video');
        }
        if (mediaType === 'audio') {
          const remoteTrack = (u as unknown as { audioTrack: AgoraTrack }).audioTrack;
          remoteTrack?.play('remote-audio');
        }
      });

      await client.join(sessionData.appId, sessionData.channelName, sessionData.token || null, sessionData.uid);
      setJoined(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join call');
    }
  };

  const leaveCall = async () => {
    localTracksRef.current.forEach(track => track.close());
    await clientRef.current?.leave();
    setJoined(false);
    try { await api.put(`/api/sessions/${id}/end`, {}); } catch { /* ignore */ }
    router.push(user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p>Loading session...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-white font-bold">🎥 Telemedicine Session</h1>
        {sessionData && <p className="text-gray-400 text-sm">Channel: {sessionData.channelName}</p>}
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {error ? (
          <div className="text-center text-white">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => router.back()} className="bg-gray-700 text-white px-6 py-3 rounded-lg">Go Back</button>
          </div>
        ) : !joined ? (
          <div className="text-center text-white max-w-md">
            <div className="text-6xl mb-6">📹</div>
            <h2 className="text-2xl font-bold mb-2">Ready to Join?</h2>
            <p className="text-gray-400 mb-6">Your session is ready. Click below to join the video call.</p>
            <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left text-sm text-gray-300 space-y-2">
              <p>📡 Channel: {sessionData?.channelName}</p>
              <p>🆔 App ID: {sessionData?.appId}</p>
              <p className="text-yellow-400">⚠️ Make sure your Agora App ID is configured in the telemedicine service.</p>
            </div>
            <button onClick={joinCall}
              className="bg-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors text-lg">
              📹 Join Video Call
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 rounded-xl aspect-video flex items-center justify-center relative">
                <div id="local-video" className="w-full h-full rounded-xl" />
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  You ({user?.name})
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl aspect-video flex items-center justify-center relative">
                <div id="remote-video" className="w-full h-full rounded-xl" />
                <div id="remote-audio" className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  Waiting for other participant...
                </div>
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">Remote</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button onClick={() => setMicOn(m => !m)}
                className={`w-14 h-14 rounded-full font-semibold transition-colors ${micOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'}`}>
                {micOn ? '🎤' : '🔇'}
              </button>
              <button onClick={() => setCamOn(c => !c)}
                className={`w-14 h-14 rounded-full font-semibold transition-colors ${camOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'}`}>
                {camOn ? '📷' : '🚫'}
              </button>
              <button onClick={leaveCall}
                className="bg-red-500 text-white px-8 h-14 rounded-full font-semibold hover:bg-red-600 transition-colors">
                End Call
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Load Agora SDK */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.21.0.js" async />
    </div>
  );
}
