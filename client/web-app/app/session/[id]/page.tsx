'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

declare global {
  interface Window {
    AgoraRTC: {
      createClient: (config: { mode: string; codec: string }) => AgoraClient;
      createMicrophoneAndCameraTracks: () => Promise<[AgoraLocalTrack, AgoraLocalTrack]>;
    };
  }
}

interface AgoraClient {
  join: (appId: string, channel: string, token: string | null, uid: number) => Promise<number>;
  publish: (tracks: AgoraLocalTrack[]) => Promise<void>;
  subscribe: (user: AgoraRemoteUser, mediaType: 'video' | 'audio') => Promise<void>;
  leave: () => Promise<void>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  remoteUsers: AgoraRemoteUser[];
}

interface AgoraLocalTrack {
  play: (element: string | HTMLElement) => void;
  stop?: () => void;
  close: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
}

interface AgoraRemoteAudioTrack {
  play: () => void;
  stop?: () => void;
}

interface AgoraRemoteUser {
  uid: number;
  videoTrack?: AgoraLocalTrack;
  audioTrack?: AgoraRemoteAudioTrack;
}

export default function VideoSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const userRef = useRef(auth.getUser());
  const user = userRef.current;

  const [sessionData, setSessionData] = useState<{
    token: string; appId: string; channelName: string; uid: number;
  } | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const clientRef = useRef<AgoraClient | null>(null);
  const micTrackRef = useRef<AgoraLocalTrack | null>(null);
  const camTrackRef = useRef<AgoraLocalTrack | null>(null);

  // Refs to the actual DOM containers Agora should render <video> into.
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  // If a remote user publishes BEFORE our call UI has mounted, queue them and
  // play once the DOM container is available.
  const pendingRemoteRef = useRef<AgoraRemoteUser | null>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // After the call UI mounts, attach the local camera track and any remote
  // track that arrived before the container existed. This is the fix for the
  // race where #local-video / #remote-video weren't in the DOM at play-time.
  useEffect(() => {
    if (!joined) return;
    if (camTrackRef.current && localVideoRef.current) {
      camTrackRef.current.play(localVideoRef.current);
    }
    const pending = pendingRemoteRef.current;
    if (pending && remoteVideoRef.current) {
      pending.videoTrack?.play(remoteVideoRef.current);
      pendingRemoteRef.current = null;
    }
  }, [joined, remoteJoined]);

  const cleanup = useCallback(async () => {
    try { micTrackRef.current?.close(); } catch { /* ignore */ }
    try { camTrackRef.current?.close(); } catch { /* ignore */ }
    micTrackRef.current = null;
    camTrackRef.current = null;
    try { await clientRef.current?.leave(); } catch { /* ignore */ }
    clientRef.current = null;
  }, []);

  // Ensure we always release the camera/mic and leave the channel when the
  // component unmounts (e.g. user closes tab or navigates away).
  useEffect(() => {
    return () => { void cleanup(); };
  }, [cleanup]);

  const joinCall = async () => {
    if (!sessionData) {
      setError('Session data not loaded yet. Please wait.');
      return;
    }
    if (!window.AgoraRTC) {
      setError('Agora SDK is still loading. Please wait a moment and try again.');
      return;
    }

    try {
      // Request camera + microphone — this triggers the browser permission prompt
      const [micTrack, camTrack] = await window.AgoraRTC.createMicrophoneAndCameraTracks();
      micTrackRef.current = micTrack;
      camTrackRef.current = camTrack;

      // Create the client and register listeners BEFORE join() so we don't miss
      // user-published events that fire for participants already in the channel.
      const client = window.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (...args: unknown[]) => {
        const remoteUser = args[0] as AgoraRemoteUser;
        const mediaType = args[1] as 'video' | 'audio';
        await client.subscribe(remoteUser, mediaType);

        if (mediaType === 'video') {
          if (remoteVideoRef.current) {
            remoteUser.videoTrack?.play(remoteVideoRef.current);
          } else {
            // The call UI hasn't mounted yet (this fires during await client.join()
            // for already-present participants). Queue and let the effect attach.
            pendingRemoteRef.current = remoteUser;
          }
          setRemoteJoined(true);
        } else if (mediaType === 'audio') {
          // Remote audio plays to the default output — no DOM element needed.
          remoteUser.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (...args: unknown[]) => {
        const mediaType = args[1] as 'video' | 'audio';
        if (mediaType === 'video') setRemoteJoined(false);
      });

      client.on('user-left', () => {
        setRemoteJoined(false);
        pendingRemoteRef.current = null;
      });

      // Switch UI into "in call" mode FIRST so the video containers exist in the
      // DOM by the time tracks need to be attached to them.
      setJoined(true);

      await client.join(
        sessionData.appId,
        sessionData.channelName,
        sessionData.token || null,
        sessionData.uid,
      );

      // Publish local tracks so the remote participant can see/hear us
      await client.publish([micTrack, camTrack]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join call';
      // Roll back the in-call UI and release any captured devices on failure.
      setJoined(false);
      await cleanup();
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('notallowed')) {
        setError('Camera/microphone access was denied. Please allow access in your browser settings and try again.');
      } else {
        setError(message);
      }
    }
  };

  const toggleMic = async () => {
    if (!micTrackRef.current) return;
    const next = !micOn;
    await micTrackRef.current.setEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    if (!camTrackRef.current) return;
    const next = !camOn;
    await camTrackRef.current.setEnabled(next);
    setCamOn(next);
  };

  const leaveCall = async () => {
    await cleanup();
    setJoined(false);
    setRemoteJoined(false);
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
      {/* Load the Agora Web SDK reliably. afterInteractive ensures it's available
          for the join button without blocking initial render. */}
      <Script
        src="https://download.agora.io/sdk/release/AgoraRTC_N-4.21.0.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onReady={() => setSdkReady(true)}
      />

      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-white font-bold">Telemedicine Session</h1>
        {sessionData && <p className="text-gray-400 text-sm">Channel: {sessionData.channelName}</p>}
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {error ? (
          <div className="text-center text-white max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-400 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setError('')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Try Again
              </button>
              <button onClick={() => router.back()} className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors">
                Go Back
              </button>
            </div>
          </div>
        ) : !joined ? (
          <div className="text-center text-white max-w-md">
            <div className="text-6xl mb-6">📹</div>
            <h2 className="text-2xl font-bold mb-2">Ready to Join?</h2>
            <p className="text-gray-400 mb-2">
              Your browser will ask for <strong>camera and microphone</strong> access when you click below.
            </p>
            <p className="text-gray-500 text-sm mb-6">Make sure to allow access to participate in the video call.</p>
            <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left text-sm text-gray-300 space-y-2">
              <p>📡 Channel: {sessionData?.channelName}</p>
              <p>🆔 App ID: {sessionData?.appId}</p>
            </div>
            <button
              onClick={joinCall}
              disabled={!sdkReady || !sessionData}
              className="bg-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors text-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sdkReady ? '📹 Join Video Call' : 'Loading video SDK…'}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Local video — absolute inset-0 guarantees Agora's injected <video> has a sized container */}
              <div className="bg-gray-800 rounded-xl aspect-video relative overflow-hidden">
                <div ref={localVideoRef} id="local-video" className="absolute inset-0" />
                {!camOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                    <span className="text-4xl">🚫</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
                  You ({user?.name})
                </div>
              </div>

              {/* Remote video */}
              <div className="bg-gray-800 rounded-xl aspect-video relative overflow-hidden">
                <div ref={remoteVideoRef} id="remote-video" className="absolute inset-0" />
                {!remoteJoined && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none z-0">
                    Waiting for other participant...
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">Remote</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleMic}
                title={micOn ? 'Mute microphone' : 'Unmute microphone'}
                className={`w-14 h-14 rounded-full text-xl font-semibold transition-colors ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
              >
                {micOn ? '🎤' : '🔇'}
              </button>
              <button
                onClick={toggleCam}
                title={camOn ? 'Turn off camera' : 'Turn on camera'}
                className={`w-14 h-14 rounded-full text-xl font-semibold transition-colors ${camOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
              >
                {camOn ? '📷' : '🚫'}
              </button>
              <button
                onClick={leaveCall}
                className="bg-red-500 text-white px-8 h-14 rounded-full font-semibold hover:bg-red-600 transition-colors"
              >
                End Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
