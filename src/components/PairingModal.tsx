import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Camera,
  RefreshCw,
  Shield,
  ArrowRight,
  Sparkles,
  Smartphone
} from 'lucide-react';
import type { LinkPairConnection } from '../utils/webrtc';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  webrtc: LinkPairConnection;
  onConnected: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  webrtc,
  onConnected
}) => {
  const [tab, setTab] = useState<'qr' | 'pin' | 'manual'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedPin, setCopiedPin] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Manual SDP exchange states
  const [generatedToken, setGeneratedToken] = useState('');
  const [remoteTokenInput, setRemoteTokenInput] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  const pairingPin = webrtc.myId;

  // Generate QR Code on open
  useEffect(() => {
    if (!isOpen) {
      stopCameraScan();
      return;
    }

    const payload = JSON.stringify({
      app: 'LinkPair',
      pin: pairingPin,
      url: window.location.origin
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [isOpen, pairingPin]);

  const copyPin = () => {
    navigator.clipboard.writeText(pairingPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleConnectByPin = async () => {
    if (!inputPin.trim()) {
      setErrorMsg('Bitte geben Sie einen 6-stelligen Code ein.');
      return;
    }
    setErrorMsg('');
    setIsConnecting(true);
    try {
      await webrtc.initConnection(true, inputPin.trim().toUpperCase());
      // Give time to connect
      setTimeout(() => {
        setIsConnecting(false);
        onClose();
        onConnected();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verbindung fehlgeschlagen');
      setIsConnecting(false);
    }
  };

  const startCameraScan = async () => {
    setIsScanning(true);
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Check if native BarcodeDetector is supported
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                handleQrScanned(rawValue);
              }
            } catch (e) {}
          }
        }, 400);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setErrorMsg('Kamerazugriff wurde verweigert oder ist nicht verfügbar.');
      setIsScanning(false);
    }
  };

  const stopCameraScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleQrScanned = (content: string) => {
    stopCameraScan();
    try {
      const parsed = JSON.parse(content);
      if (parsed.pin) {
        setInputPin(parsed.pin);
        webrtc.initConnection(true, parsed.pin).then(() => {
          onClose();
          onConnected();
        });
      }
    } catch {
      if (content.length <= 10) {
        setInputPin(content);
        webrtc.initConnection(true, content).then(() => {
          onClose();
          onConnected();
        });
      }
    }
  };

  const handleGenerateManualOffer = async () => {
    try {
      setIsConnecting(true);
      const token = await webrtc.initConnection(true, 'AIRGAP');
      setGeneratedToken(token);
      setIsConnecting(false);
    } catch (e: any) {
      setErrorMsg(e.message);
      setIsConnecting(false);
    }
  };

  const handleApplyRemoteToken = async () => {
    if (!remoteTokenInput.trim()) return;
    try {
      setIsConnecting(true);
      if (!generatedToken) {
        // We are receiver: handle offer and generate answer
        const answer = await webrtc.handleOfferToken(remoteTokenInput.trim());
        setGeneratedToken(answer);
      } else {
        // We are initiator: apply answer
        await webrtc.handleAnswerToken(remoteTokenInput.trim());
        onClose();
        onConnected();
      }
      setIsConnecting(false);
    } catch (e: any) {
      setErrorMsg('Ungültiges Token oder Token-Fehler');
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Gerät koppeln</h3>
              <p className="text-xs text-slate-400">WebRTC Direct P2P Verbindung</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraScan();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => {
              stopCameraScan();
              setTab('qr');
            }}
            className={`flex items-center space-x-2 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              tab === 'qr'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR-Code</span>
          </button>

          <button
            onClick={() => {
              stopCameraScan();
              setTab('pin');
            }}
            className={`flex items-center space-x-2 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              tab === 'pin'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Kopplungs-PIN</span>
          </button>

          <button
            onClick={() => {
              stopCameraScan();
              setTab('manual');
            }}
            className={`flex items-center space-x-2 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              tab === 'manual'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Air-Gap (Token)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: QR CODE */}
          {tab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4">
              {!isScanning ? (
                <>
                  <p className="text-xs text-slate-300">
                    Scannen Sie diesen Code mit der Kamera Ihres Smartphones oder der LinkPair APK:
                  </p>

                  <div className="p-3 bg-white rounded-2xl shadow-xl shadow-cyan-500/10 border-4 border-cyan-500/30">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="LinkPair QR Code" className="w-56 h-56 object-contain" />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400">PIN:</span>
                    <span className="text-sm font-mono font-bold text-cyan-400 tracking-wider">
                      {pairingPin}
                    </span>
                    <button
                      onClick={copyPin}
                      className="p-1 text-slate-400 hover:text-cyan-300 transition"
                      title="PIN kopieren"
                    >
                      {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="w-full pt-2">
                    <button
                      onClick={startCameraScan}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
                    >
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <span>Mit Kamera scannen</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full space-y-3">
                  <p className="text-xs text-slate-300">Halten Sie die Kamera auf den QR-Code des Partnergeräts:</p>
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-cyan-500/40">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                    <div className="absolute inset-0 border-2 border-dashed border-cyan-400/60 m-8 rounded-lg pointer-events-none animate-pulse" />
                  </div>
                  <button
                    onClick={stopCameraScan}
                    className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                  >
                    Kamera beenden
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PIN CODE */}
          {tab === 'pin' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Ihr eigener Kopplungscode:</span>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-mono font-bold text-white tracking-widest">
                    {pairingPin}
                  </div>
                  <button
                    onClick={copyPin}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-xs hover:bg-cyan-900 transition"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Kopiert' : 'Kopieren'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <label className="text-xs font-medium text-slate-300">
                  Code des anderen Geräts eingeben:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                    placeholder="z.B. A7B89X"
                    maxLength={10}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-widest uppercase focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleConnectByPin}
                    disabled={isConnecting}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Verbinden</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  Auf demselben Gerät oder lokalen Netzwerk verbinden sich zwei offene Browser-Tabs automatisch über den integrierten lokalen Signalkanal.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: AIR-GAP TOKEN */}
          {tab === 'manual' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Für maximale Privatsphäre ohne jegliche Signal-Server: Tauschen Sie die verschlüsselten WebRTC-Handshake-Tokens manuell aus.
              </p>

              {!generatedToken ? (
                <button
                  onClick={handleGenerateManualOffer}
                  disabled={isConnecting}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition"
                >
                  {isConnecting ? 'Generiere Token...' : 'Kopplungs-Token erstellen'}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Ihr Token (Senden Sie dies an Partner):</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedToken);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken ? 'Kopiert' : 'Kopieren'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={generatedToken}
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[10px] resize-none"
                  />
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="text-xs text-slate-300">
                  Antwort-Token des Partners hier einfügen:
                </label>
                <textarea
                  value={remoteTokenInput}
                  onChange={(e) => setRemoteTokenInput(e.target.value)}
                  placeholder="Remote-Token hier einfügen..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[10px] resize-none focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleApplyRemoteToken}
                  disabled={isConnecting || !remoteTokenInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold disabled:opacity-50 transition"
                >
                  {isConnecting ? 'Verbinde...' : 'Token anwenden & Koppeln'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>LinkPair Android APK Kompatibel</span>
          </div>
          <span className="text-emerald-400 font-medium">WebRTC DTLS 1.3</span>
        </div>
      </div>
    </div>
  );
};
