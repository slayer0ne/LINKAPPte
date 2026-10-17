import React from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isInstallable: boolean;
  isIOS: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isIOS
}) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-lg shadow-cyan-500/20">
              <img
                src="/logo.png"
                alt="LinkPair"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">LinkPair App installieren</h3>
              <p className="text-xs text-slate-400">Direkt auf dem Startbildschirm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2 text-xs text-slate-300">
            <p>
              Als native WebAPK / PWA bietet LinkPair folgende Vorteile auf Ihrem Smartphone:
            </p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-center space-x-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Voller Vollbildmodus ohne Browser-Adressleiste</span>
              </li>
              <li className="flex items-center space-x-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hardwarebeschleunigter WebRTC Kamera- & Mikrofon-Zugriff</span>
              </li>
              <li className="flex items-center space-x-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Offline-Fähigkeit durch integrierten Service Worker</span>
              </li>
              <li className="flex items-center space-x-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% werbefrei und ohne Cloud-Datenspeicherung</span>
              </li>
            </ul>
          </div>

          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm shadow-xl shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Jetzt auf Android installieren</span>
            </button>
          )}

          {isIOS && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-white block">Installation auf iPhone / iPad:</span>
              <p className="text-slate-300 leading-relaxed">
                1. Tippen Sie in Safari unten auf das <strong className="text-cyan-400">Teilen-Symbol</strong>{' '}
                <Share2 className="w-3.5 h-3.5 inline mx-0.5" />.<br />
                2. Scrollen Sie nach unten und wählen Sie{' '}
                <strong className="text-cyan-400">"Zum Home-Bildschirm"</strong>.<br />
                3. Tippen Sie oben rechts auf <strong className="text-white">"Hinzufügen"</strong>.
              </p>
            </div>
          )}

          {!isInstallable && !isIOS && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
              <span className="font-semibold text-white block">Bereits im Browser aktiv:</span>
              <p>
                Sie können die App über das Drei-Punkte-Menü Ihres Chrome-Browsers via{' '}
                <strong className="text-cyan-400">"App installieren"</strong> oder{' '}
                <strong className="text-cyan-400">"Zum Startbildschirm hinzufügen"</strong> direkt festlegen.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sichere PWA / WebAPK Signatur</span>
          </span>
          <button onClick={onClose} className="hover:text-white transition">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
