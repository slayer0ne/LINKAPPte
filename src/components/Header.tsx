import React from 'react';
import {
  Smartphone,
  ShieldCheck,
  Wifi,
  WifiOff,
  QrCode,
  Download,
  Share2,
  MessageSquare,
  FileUp,
  Video,
  Globe,
  BarChart3,
  Bell,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import type { ConnectionState, DeviceInfo } from '../types/linkpair';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: 'chat' | 'files' | 'call' | 'apk' | 'web' | 'analytics';
  setActiveTab: (tab: 'chat' | 'files' | 'call' | 'apk' | 'web' | 'analytics') => void;
  connectionState: ConnectionState;
  latencyMs: number;
  peerDeviceInfo: DeviceInfo | null;
  onOpenPairing: () => void;
  onOpenInstall: () => void;
  onOpenNotifications: () => void;
  onOpenThemeSettings: () => void;
  unreadNotificationsCount: number;
  isInstallable: boolean;
  onDisconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  connectionState,
  latencyMs,
  peerDeviceInfo,
  onOpenPairing,
  onOpenInstall,
  onOpenNotifications,
  onOpenThemeSettings,
  unreadNotificationsCount,
  isInstallable,
  onDisconnect
}) => {
  const isConnected = connectionState === 'connected';
  const { effectiveTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-lg shadow-cyan-500/20">
              <img
                src="/logo.png"
                alt="LinkPair Logo"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">LinkPair</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  P2P Go
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sichere direkte Peer-to-Peer Verbindung
              </p>
            </div>
          </div>

          {/* Connection Status Pill */}
          <div className="hidden md:flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  : connectionState === 'connecting'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60 animate-pulse'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verbunden</span>
                  {latencyMs > 0 && (
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      ({latencyMs} ms)
                    </span>
                  )}
                  {peerDeviceInfo && (
                    <span className="text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-200">
                      {peerDeviceInfo.name}
                    </span>
                  )}
                  <span title="Ende-zu-Ende verschlüsselt">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 ml-1" />
                  </span>
                </>
              ) : connectionState === 'connecting' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Verbindungsaufbau...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nicht gekoppelt</span>
                </>
              )}
            </div>

            {isConnected && (
              <button
                onClick={onDisconnect}
                className="text-xs text-rose-400 hover:text-rose-300 transition px-2 py-1"
              >
                Trennen
              </button>
            )}
          </div>

          {/* Actions: Pairing & Notifications & APK & Install */}
          <div className="flex items-center space-x-2">
            {!isConnected ? (
              <button
                onClick={onOpenPairing}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm shadow-md hover:from-cyan-400 hover:to-blue-500 transition active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Gerät koppeln</span>
                <span className="sm:hidden">Koppeln</span>
              </button>
            ) : (
              <button
                onClick={onOpenPairing}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Neues Gerät</span>
              </button>
            )}

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
              title="Push-Benachrichtigungen & Erinnerungen"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-bounce">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Quick 1-Click Material 3 / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
              title={effectiveTheme === 'dark' ? 'Zu Google Material 3 Hellmodus wechseln' : 'Zu Obsidian Dunkelmodus wechseln'}
            >
              {effectiveTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Theme Settings & Accessibility Modal Button */}
            <button
              onClick={onOpenThemeSettings}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-purple-400 transition"
              title="Material Design Theme & Barrierefreiheit wählen"
            >
              <Palette className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('apk')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'apk'
                  ? 'bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
              <span className="font-semibold">APK & Android</span>
            </button>

            {isInstallable && (
              <button
                onClick={onOpenInstall}
                className="hidden lg:flex items-center space-x-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installieren</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>P2P Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'files'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Dateiübertragung</span>
          </button>

          <button
            onClick={() => setActiveTab('call')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'call'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video & Anruf</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Metriken & Graphen</span>
            <span className="text-[10px] px-1 bg-cyan-500/20 text-cyan-300 rounded font-bold">Live</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'apk'
                ? 'bg-gradient-to-r from-cyan-900 to-blue-900 text-cyan-200 border border-cyan-600/60 shadow-sm'
                : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>APK Bauen & Download</span>
            <span className="text-[10px] px-1 bg-cyan-500/20 text-cyan-300 rounded font-bold">APK</span>
          </button>

          <button
            onClick={() => setActiveTab('web')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'web'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>P2P Netzwerk-Hub</span>
          </button>
        </div>
      </div>
    </header>
  );
};
