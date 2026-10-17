import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  ShieldCheck,
  Maximize2,
  RefreshCw,
  QrCode
} from 'lucide-react';
import type { ConnectionState } from '../types/linkpair';
import type { LinkPairConnection } from '../utils/webrtc';

interface VideoCallViewProps {
  webrtc: LinkPairConnection;
  connectionState: ConnectionState;
  onOpenPairing: () => void;
}

export const VideoCallView: React.FC<VideoCallViewProps> = ({
  webrtc,
  connectionState,
  onOpenPairing
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const durationTimerRef = useRef<any>(null);

  const isConnected = connectionState === 'connected';

  // Remote Stream callback
  useEffect(() => {
    webrtc.onRemoteStream = (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        if (stream) {
          remoteVideoRef.current.play().catch(() => {});
        }
      }
    };

    return () => {
      webrtc.onRemoteStream = undefined;
    };
  }, [webrtc]);

  // Duration timer
  useEffect(() => {
    if (isInCall) {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isInCall]);

  const startCall = async (audioOnly: boolean = false) => {
    try {
      setCallType(audioOnly ? 'audio' : 'video');
      const stream = await webrtc.startMediaCall(audioOnly);
      setIsInCall(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      alert('Kamera- oder Mikrofonzugriff fehlgeschlagen: ' + err.message);
    }
  };

  const endCall = () => {
    webrtc.endMediaCall();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsInCall(false);
  };

  const toggleAudio = () => {
    if (webrtc.localStream) {
      const audioTracks = webrtc.localStream.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (webrtc.localStream) {
      const videoTracks = webrtc.localStream.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsVideoDisabled(!isVideoDisabled);
    }
  };

  const formatDuration = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl p-4 md:p-6 space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <span>Direkter P2P Video- & Audio-Anruf</span>
            {isInCall && (
              <span className="flex items-center space-x-1 text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{formatDuration(callDuration)}</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            Realtime MediaStream mit DTLS-SRTP Verschlüsselung direkt zwischen beiden Geräten.
          </p>
        </div>

        {!isConnected && (
          <button
            onClick={onOpenPairing}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow hover:from-cyan-400 hover:to-blue-500 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Koppeln</span>
          </button>
        )}
      </div>

      {/* Video Viewport Area */}
      <div className="flex-1 relative bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[350px]">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${!isInCall ? 'hidden' : ''}`}
        />

        {/* Local Video (Picture in Picture) */}
        {isInCall && callType === 'video' && (
          <div className="absolute top-4 right-4 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden border-2 border-cyan-500 shadow-2xl bg-slate-900 z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
            />
            {isVideoDisabled && (
              <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
                Kamera aus
              </div>
            )}
          </div>
        )}

        {/* Placeholder when not in call */}
        {!isInCall && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-xl">
              <Video className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">P2P Anruf starten</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Verbinden Sie Audio & Video in HD-Qualität direkt von Smartphone zu PC oder Smartphone zu Smartphone.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => startCall(false)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Video-Anruf starten</span>
              </button>

              <button
                onClick={() => startCall(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
              >
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>Nur Audio</span>
              </button>
            </div>
          </div>
        )}

        {/* Security badge overlay */}
        {isInCall && (
          <div className="absolute top-4 left-4 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-[11px] text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>DTLS 1.3 P2P Verschlüsselt</span>
          </div>
        )}
      </div>

      {/* Call Toolbar Controls */}
      {isInCall && (
        <div className="flex items-center justify-center space-x-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition ${
              isAudioMuted
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={isAudioMuted ? 'Mikrofon einschalten' : 'Stummschalten'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition ${
              isVideoDisabled
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={isVideoDisabled ? 'Kamera aktivieren' : 'Kamera deaktivieren'}
          >
            {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={endCall}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition active:scale-95"
            title="Anruf beenden"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
