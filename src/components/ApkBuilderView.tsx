import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Smartphone,
  Download,
  PackageCheck,
  ShieldCheck,
  Settings,
  CheckCircle2,
  FileCode2,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Info,
  Layers
} from 'lucide-react';
import type { ApkBuildOptions } from '../types/linkpair';
import { generateAndroidStudioProject, generateStandaloneApk } from '../utils/apkGenerator';

interface ApkBuilderViewProps {
  onInstallPwa: () => void;
  isInstallable: boolean;
}

export const ApkBuilderView: React.FC<ApkBuilderViewProps> = ({
  onInstallPwa,
  isInstallable
}) => {
  const [appName, setAppName] = useState('LinkPair');
  const [packageName, setPackageName] = useState('com.linkpair.go');
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState(100);
  const [webUrl, setWebUrl] = useState(typeof window !== 'undefined' ? window.location.origin : 'https://linkpair.app');
  const [primaryColor, setPrimaryColor] = useState('#06b6d4');
  const [themeColor, setThemeColor] = useState('#090d16');

  const [includeCamera, setIncludeCamera] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeStorage, setIncludeStorage] = useState(true);
  const [buildMode, setBuildMode] = useState<'offline-native' | 'web-linked'>('offline-native');

  const [isBuildingApk, setIsBuildingApk] = useState(false);
  const [isBuildingZip, setIsBuildingZip] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedCli, setCopiedCli] = useState(false);

  const buildOptions: ApkBuildOptions = {
    appName,
    packageName,
    versionName,
    versionCode,
    webUrl,
    primaryColor,
    themeColor,
    includeCameraPermission: includeCamera,
    includeRecordAudioPermission: includeAudio,
    includeStoragePermission: includeStorage,
    buildMode
  };

  const getLogoBlob = async (): Promise<Blob | undefined> => {
    try {
      const res = await fetch('/logo.png');
      if (res.ok) {
        return await res.blob();
      }
    } catch (e) {}
    return undefined;
  };

  const handleDownloadApk = async () => {
    setIsBuildingApk(true);
    setSuccessMessage('');
    try {
      const iconBlob = await getLogoBlob();
      const apkBlob = await generateStandaloneApk(buildOptions, iconBlob);

      const url = URL.createObjectURL(apkBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appName.replace(/\s+/g, '_')}-v${versionName}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessMessage('APK erfolgreich generiert und heruntergeladen!');
    } catch (err: any) {
      alert('Fehler beim Erstellen der APK: ' + err.message);
    } finally {
      setIsBuildingApk(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsBuildingZip(true);
    setSuccessMessage('');
    try {
      const iconBlob = await getLogoBlob();
      const zipBlob = await generateAndroidStudioProject(buildOptions, iconBlob);

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appName.replace(/\s+/g, '_')}-Android-Studio-Project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSuccessMessage('Android Studio Projekt (.zip) erfolgreich erstellt und heruntergeladen!');
    } catch (err: any) {
      alert('Fehler beim Erstellen des Projekts: ' + err.message);
    } finally {
      setIsBuildingZip(false);
    }
  };

  const cliSnippet = `npx @bubblewrap/cli build --manifest=${webUrl}/manifest.json`;

  const copyCliSnippet = () => {
    navigator.clipboard.writeText(cliSnippet);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-y-auto shadow-xl p-4 md:p-8 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 shadow-xl shadow-cyan-500/20 shrink-0">
            <img
              src="/logo.png"
              alt="LinkPair Icon"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                LinkPair APK & Android Studio Builder
              </h1>
              <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                Autonomer P2P Build
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Erstellt die fertige Android APK und das vollständige native Android Studio Projekt basierend auf Ihrer eigenständigen P2P-Instanz ({webUrl}). Völlig unabhängig ohne externe Plattformabhängigkeiten.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/LinkPair-Offline-v1.0.0.apk"
            download="LinkPair-Offline-v1.0.0.apk"
            onClick={() => {
              confetti({
                particleCount: 90,
                spread: 75,
                origin: { y: 0.6 }
              });
              setSuccessMessage('100% Offline Native APK (LinkPair-Offline-v1.0.0.apk) wird heruntergeladen!');
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>Offline APK herunterladen (.apk)</span>
          </a>

          <a
            href="/LinkPair-Native-Offline-Project.zip"
            download="LinkPair-Native-Offline-Project.zip"
            onClick={() => {
              confetti({
                particleCount: 60,
                spread: 60,
                origin: { y: 0.6 }
              });
              setSuccessMessage('Natives Android Studio Offline-Projekt (.zip) wird heruntergeladen!');
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition active:scale-95"
          >
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <span>Android Studio Projekt (.zip)</span>
          </a>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid: App Parameters & Build Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Paket- & App-Konfiguration</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                {buildMode === 'offline-native' ? '100% Offline Standalone' : 'Web-Linked'}
              </span>
            </div>

            {/* Build Mode Selector: Offline Standalone vs Web-Linked */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Betriebsart der APK (Architektur):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setBuildMode('offline-native')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-1.5 ${
                    buildMode === 'offline-native'
                      ? 'bg-cyan-950/50 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span>Offline Native (Nicht webbasiert)</span>
                    </span>
                    {buildMode === 'offline-native' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Alle HTML, CSS, JavaScript und WebRTC-Dateien liegen direkt in der APK. Kein Webserver oder Internet nötig!
                  </p>
                </div>

                <div
                  onClick={() => setBuildMode('web-linked')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-1.5 ${
                    buildMode === 'web-linked'
                      ? 'bg-cyan-950/50 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      <span>Web-Verknüpft (URL)</span>
                    </span>
                    {buildMode === 'web-linked' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Lädt die Benutzeroberfläche bei jedem Start von einer entfernten Web-Adresse.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-400">Anwendungsname</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400">Android Paket-ID</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400">Versionsname</label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400">Versionscode</label>
                <input
                  type="number"
                  value={versionCode}
                  onChange={(e) => setVersionCode(Number(e.target.value))}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-400">Basis-URL der Anwendung</label>
                <input
                  type="url"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Android Permissions Checklist */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-medium text-slate-300 block">
                Erforderliche Android-Berechtigungen (in AndroidManifest.xml aktiviert):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCamera}
                    onChange={(e) => setIncludeCamera(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                  <span>Kamera (QR & Video)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                  <span>Mikrofon (Audio)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStorage}
                    onChange={(e) => setIncludeStorage(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                  <span>Dateispeicher</span>
                </label>
              </div>
            </div>
          </div>

          {/* Comprehensive 100% Offline Build Guide */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Wie erstelle ich daraus die APK? (100% Nicht webbasiert)</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="font-bold text-cyan-300 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-[10px]">1</span>
                  <span>Weg 1: Fertige Offline-APK direkt herunterladen (Am schnellsten)</span>
                </span>
                <p className="text-slate-400 pl-6">
                  Klicken Sie oben auf <strong className="text-white">"Offline APK herunterladen (.apk)"</strong>. Die Datei enthält bereits alle React-, Tailwind-, WebRTC- und Design-Dateien fest integriert und startet sofort ohne Internet.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-300 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-[10px]">2</span>
                  <span>Weg 2: Mit Android Studio selbst kompilieren (Kostenlos)</span>
                </span>
                <ol className="list-decimal list-inside text-slate-400 pl-6 space-y-1">
                  <li>Laden Sie oben das <strong className="text-white">Android Studio Projekt (.zip)</strong> herunter.</li>
                  <li>Entpacken Sie den Ordner auf Ihrem PC oder Mac.</li>
                  <li>Öffnen Sie <strong className="text-white">Android Studio</strong> und wählen Sie <em>"Open"</em>.</li>
                  <li>Klicken Sie im Menü auf <strong className="text-white">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
                  <li>Die fertige APK liegt in <code className="text-cyan-300 font-mono">app/build/outputs/apk/debug/app-debug.apk</code>.</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="font-bold text-purple-300 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center text-[10px]">3</span>
                  <span>Weg 3: Vollautomatisch online via GitHub Actions (Keine Software auf dem PC!)</span>
                </span>
                <p className="text-slate-400 pl-6">
                  Laden Sie das ZIP-Projekt in Ihr GitHub-Konto hoch. Die beiliegende Datei <code className="text-cyan-300 font-mono">.github/workflows/build-apk.yml</code> kompiliert die APK automatisch in ca. 2 Minuten kostenlos in der Cloud!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Build Artifacts & PWA Option */}
        <div className="space-y-6">
          {/* Quick PWA WebAPK Option */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-950 to-blue-950/50 border border-cyan-800/40 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Sparkles className="w-5 h-5" />
              <h4 className="font-semibold text-white text-sm">Direkte WebAPK-Installation</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sie können LinkPair auch sofort ohne USB-Kabel als vollwertige WebAPK direkt über den Chrome-Browser auf Android installieren:
            </p>
            <button
              onClick={onInstallPwa}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Auf Android installieren</span>
            </button>
          </div>

          {/* App Metadata Card */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
            <h4 className="font-semibold text-white flex items-center space-x-2">
              <PackageCheck className="w-4 h-4 text-cyan-400" />
              <span>Build-Metadaten</span>
            </h4>

            <div className="space-y-2 text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Plattform / Host:</span>
                <span className="font-mono text-cyan-400">LinkPair Standalone Node</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Ziel-SDK:</span>
                <span className="font-mono text-white">Android 14 (API 34)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Minimale SDK:</span>
                <span className="font-mono text-white">Android 7.0 (API 24)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Verschlüsselung:</span>
                <span className="text-emerald-400 font-medium">WebRTC DTLS-SRTP</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Signatur:</span>
                <span className="font-mono text-[11px] text-slate-300">SHA-256 Release</span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 text-slate-300">
                <span>Credits:</span>
                <span className="font-medium text-rose-400 flex items-center space-x-1">
                  <span>Built with love - Jude</span>
                  <span>❤️</span>
                </span>
              </div>
            </div>
          </div>

          {/* Terminal / Bubblewrap Command */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>CLI Build-Befehl</span>
              </span>
              <button
                onClick={copyCliSnippet}
                className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 text-[11px]"
              >
                {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCli ? 'Kopiert' : 'Kopieren'}</span>
              </button>
            </div>
            <div className="p-3 bg-black rounded-xl border border-slate-800 font-mono text-[10px] text-cyan-300 overflow-x-auto">
              <code>{cliSnippet}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
