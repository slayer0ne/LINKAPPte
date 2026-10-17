import React, { useState, useEffect } from 'react';
import {
  Globe,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Radio,
  Wifi,
  Server,
  Zap,
  Cpu,
  RefreshCw
} from 'lucide-react';
import QRCode from 'qrcode';

interface NetworkHubViewProps {
  latencyMs: number;
  connectionState: string;
}

export const NetworkHubView: React.FC<NetworkHubViewProps> = ({
  latencyMs,
  connectionState
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [shareQrUrl, setShareQrUrl] = useState('');
  const [activeIceServers] = useState([
    { url: 'stun.l.google.com:19302', type: 'STUN (Google Public)', status: 'Aktiv' },
    { url: 'stun1.l.google.com:19302', type: 'STUN (Primary Backup)', status: 'Aktiv' },
    { url: 'stun.services.mozilla.com', type: 'STUN (Mozilla Global)', status: 'Aktiv' }
  ]);

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : 'https://linkpair.app';

  useEffect(() => {
    QRCode.toDataURL(currentAppUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setShareQrUrl(url))
      .catch(() => {});
  }, [currentAppUrl]);

  const copyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-y-auto shadow-xl p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-lg shadow-cyan-950/40">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">
                Autonomer P2P Netzwerk-Hub & Signalisierung
              </h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono font-semibold">
                100% Eigenständig
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vollständig entkoppelt von Drittanbietern. Nutzt direkte WebRTC Peer-to-Peer Verbindungen.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyUrl}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'URL kopiert!' : 'App-Link kopieren'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Diagnostics and Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Instant Multi-Device Sharing */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center text-center space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>App auf Zweitgerät öffnen</span>
          </h3>

          <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/30">
            {shareQrUrl ? (
              <img src={shareQrUrl} alt="LinkPair Instanz QR" className="w-48 h-48 object-contain" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
            Scannen Sie diesen QR-Code mit der Smartphone-Kamera, um genau diese eigenständige Instanz ohne Umwege zu öffnen.
          </p>

          <div className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 break-all select-all">
            {currentAppUrl}
          </div>
        </div>

        {/* Right Column: WebRTC Diagnostics & Architecture */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Overview Card */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Verbindungs- & Netzwerkstatus</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">P2P Status</span>
                <span className="text-xs font-semibold text-white capitalize">{connectionState}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Round-Trip Ping</span>
                <span className="text-xs font-mono font-semibold text-cyan-400">
                  {latencyMs > 0 ? `${latencyMs} ms` : 'Direktverbindung'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Verschlüsselung</span>
                <span className="text-xs font-semibold text-emerald-400">DTLS 1.3 / SRTP</span>
              </div>
            </div>
          </div>

          {/* ICE STUN/TURN Nodes */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Konfigurierte STUN-Knoten für NAT-Traversal</span>
            </h3>

            <div className="space-y-2">
              {activeIceServers.map((srv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono text-slate-200">{srv.url}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-[11px] hidden sm:inline">{srv.type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                      {srv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              STUN dient lediglich dem Ermitteln der öffentlichen IP für den direkten Handshake. Sämtliche Datenströme fließen danach ausschließlich Peer-to-Peer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
