import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { PairingModal } from './components/PairingModal';
import { ChatView } from './components/ChatView';
import { FileTransferView } from './components/FileTransferView';
import { VideoCallView } from './components/VideoCallView';
import { ApkBuilderView } from './components/ApkBuilderView';
import { NetworkHubView } from './components/NetworkHubView';
import { AnalyticsChartsView } from './components/AnalyticsChartsView';
import { InstallModal } from './components/InstallModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LinkPairConnection } from './utils/webrtc';
import { usePWAInstall } from './hooks/usePWAInstall';
import { NotificationService, type AppNotification } from './utils/notifications';
import { MetricsTracker, type MetricLogEntry } from './utils/metricsTracker';
import type { ConnectionState, DeviceInfo, FileTransferItem, Message } from './types/linkpair';
import {
  ShieldCheck,
  Smartphone,
  Lock,
  Wifi,
  Sparkles,
  Download,
  Bell,
  Activity,
  Palette
} from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'call' | 'apk' | 'web' | 'analytics'>('apk');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [peerDeviceInfo, setPeerDeviceInfo] = useState<DeviceInfo | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileTransferItem[]>([]);

  // Theme
  const { effectiveTheme } = useTheme();

  // Notifications & Metrics
  const notifService = useMemo(() => NotificationService.getInstance(), []);
  const metricsTracker = useMemo(() => MetricsTracker.getInstance(), []);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => notifService.getNotifications());
  const [metricsLogs, setMetricsLogs] = useState<MetricLogEntry[]>(() => metricsTracker.getLogs());

  // Modals
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // WebRTC Instance
  const webrtcRef = useRef<LinkPairConnection | null>(null);
  if (!webrtcRef.current) {
    webrtcRef.current = new LinkPairConnection();
  }
  const webrtc = webrtcRef.current;

  // Unread notifications count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  useEffect(() => {
    notifService.onNewNotification = (newNotif) => {
      setNotifications(notifService.getNotifications());
      metricsTracker.addLog({
        category: 'notification',
        title: newNotif.title,
        detail: newNotif.body,
        value: 1,
        unit: 'Meldung',
        status: 'optimal'
      });
      setMetricsLogs(metricsTracker.getLogs());
    };
  }, [notifService, metricsTracker]);

  useEffect(() => {
    webrtc.onStateChange = (state) => {
      setConnectionState(state);
      metricsTracker.addLog({
        category: 'security',
        title: `P2P Status: ${state.toUpperCase()}`,
        detail: `WebRTC Verbindungszustand gewechselt zu ${state}`,
        value: state === 'connected' ? 100 : 0,
        unit: '%',
        status: state === 'connected' ? 'optimal' : state === 'failed' ? 'warning' : 'normal'
      });
      setMetricsLogs(metricsTracker.getLogs());

      if (state === 'connected') {
        notifService.sendNotification(
          'Gerät erfolgreich gekoppelt!',
          'Sichere direkte Ende-zu-Ende P2P Verbindung hergestellt.',
          'p2p'
        );
      }
    };

    webrtc.onLatencyUpdate = (ms) => {
      setLatencyMs(ms);
      metricsTracker.addLog({
        category: 'latency',
        title: 'RTT Ping Messung',
        detail: `Direkter Round-Trip Ping: ${ms} ms`,
        value: ms,
        unit: 'ms',
        status: ms < 50 ? 'optimal' : ms < 150 ? 'normal' : 'warning'
      });
      setMetricsLogs(metricsTracker.getLogs());
    };

    webrtc.onDeviceInfo = (info) => {
      setPeerDeviceInfo(info);
    };

    webrtc.onMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      notifService.sendNotification(
        'Neue Nachricht von Partnergerät',
        msg.text.length > 50 ? `${msg.text.substring(0, 50)}...` : msg.text,
        'chat'
      );
      metricsTracker.addLog({
        category: 'chat',
        title: 'P2P Chat empfangen',
        detail: `${msg.text.length} Zeichen über RTCDataChannel`,
        value: msg.text.length,
        unit: 'Zeichen',
        status: 'optimal'
      });
      setMetricsLogs(metricsTracker.getLogs());
    };

    webrtc.onFileProgress = (item) => {
      setFiles((prev) => {
        const idx = prev.findIndex((f) => f.id === item.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [item, ...prev];
      });
    };

    webrtc.onFileReceived = (item) => {
      setFiles((prev) => {
        const idx = prev.findIndex((f) => f.id === item.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [item, ...prev];
      });

      notifService.sendNotification(
        'Datei empfangen!',
        `${item.name} (${Math.round(item.size / 1024)} KB) erfolgreich übertragen.`,
        'transfer'
      );

      metricsTracker.addLog({
        category: 'transfer',
        title: `Datei empfangen: ${item.name}`,
        detail: `Größe: ${Math.round(item.size / 1024)} KB • Geschwindigkeit: ${item.speed}`,
        value: Math.round(item.size / 1024),
        unit: 'KB',
        status: 'optimal'
      });
      setMetricsLogs(metricsTracker.getLogs());
    };

    return () => {
      webrtc.disconnect();
    };
  }, [webrtc, notifService, metricsTracker]);

  const handleSendMessage = (text: string, type: 'text' | 'clipboard' = 'text') => {
    const msg = webrtc.sendMessage(text, type);
    if (msg) {
      setMessages((prev) => [...prev, msg]);
    } else {
      const optimisticMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'me',
        text,
        timestamp: Date.now(),
        type
      };
      setMessages((prev) => [...prev, optimisticMsg]);
    }

    metricsTracker.addLog({
      category: 'chat',
      title: 'P2P Chat gesendet',
      detail: `${text.length} Zeichen über RTCDataChannel`,
      value: text.length,
      unit: 'Zeichen',
      status: 'optimal'
    });
    setMetricsLogs(metricsTracker.getLogs());
  };

  const handleSendFile = async (file: File) => {
    try {
      await webrtc.sendFile(file, (updatedItem) => {
        setFiles((prev) => {
          const idx = prev.findIndex((f) => f.id === updatedItem.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = updatedItem;
            return next;
          }
          return [updatedItem, ...prev];
        });
      });

      notifService.sendNotification(
        'Datei erfolgreich versendet',
        `${file.name} wurde direkt an den Peer übertragen.`,
        'transfer'
      );

      metricsTracker.addLog({
        category: 'transfer',
        title: `Datei gesendet: ${file.name}`,
        detail: `Volumen: ${Math.round(file.size / 1024)} KB`,
        value: Math.round(file.size / 1024),
        unit: 'KB',
        status: 'optimal'
      });
      setMetricsLogs(metricsTracker.getLogs());
    } catch (err: any) {
      alert('Datei konnte nicht gesendet werden: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-200">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionState={connectionState}
        latencyMs={latencyMs}
        peerDeviceInfo={peerDeviceInfo}
        onOpenPairing={() => setIsPairingOpen(true)}
        onOpenInstall={() => setIsInstallOpen(true)}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
          notifService.markAllAsRead();
          setNotifications(notifService.getNotifications());
        }}
        onOpenThemeSettings={() => setIsThemeSettingsOpen(true)}
        unreadNotificationsCount={unreadCount}
        isInstallable={isInstallable}
        onDisconnect={() => webrtc.disconnect()}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
        {/* Security, Analytics & Quick Notification Bar */}
        <div className="mb-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-white">Sicherheitsstandard 2026: </span>
              <span className="text-slate-300">
                DTLS 1.3 / SRTP verschlüsselt • Zero-Cloud P2P • Push-Meldungen & Material 3
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center space-x-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Metriken</span>
            </button>

            <button
              onClick={() => setIsThemeSettingsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Material Design</span>
              <span className="text-[10px] px-1 bg-purple-950 text-purple-300 rounded font-mono uppercase">
                {effectiveTheme}
              </span>
            </button>

            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Push</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setIsSecurityAuditOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Audit</span>
            </button>
          </div>
        </div>

        {/* Tab Views */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          {activeTab === 'apk' && (
            <ApkBuilderView
              onInstallPwa={() => setIsInstallOpen(true)}
              isInstallable={isInstallable}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              connectionState={connectionState}
              onOpenPairing={() => setIsPairingOpen(true)}
            />
          )}

          {activeTab === 'files' && (
            <FileTransferView
              files={files}
              onSendFile={handleSendFile}
              connectionState={connectionState}
              onOpenPairing={() => setIsPairingOpen(true)}
            />
          )}

          {activeTab === 'call' && (
            <VideoCallView
              webrtc={webrtc}
              connectionState={connectionState}
              onOpenPairing={() => setIsPairingOpen(true)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsChartsView
              logs={metricsLogs}
              currentLatencyMs={latencyMs}
            />
          )}

          {activeTab === 'web' && (
            <NetworkHubView
              latencyMs={latencyMs}
              connectionState={connectionState}
            />
          )}
        </div>
      </main>

      {/* Global Footer & Credits */}
      <footer className="py-4 px-6 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-slate-400">LinkPair P2P Go</span>
          <span>•</span>
          <span>Autonome WebRTC & APK Suite</span>
        </div>
        <div className="flex items-center space-x-1.5 font-medium text-slate-300 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800 shadow-sm">
          <span>Built with love - Jude</span>
          <span className="text-rose-500 text-sm animate-pulse">❤️</span>
        </div>
      </footer>

      {/* Modals */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        webrtc={webrtc}
        onConnected={() => setIsPairingOpen(false)}
      />

      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        onInstall={install}
        isInstallable={isInstallable}
        isIOS={isIOS}
      />

      <SecurityAuditModal
        isOpen={isSecurityAuditOpen}
        onClose={() => setIsSecurityAuditOpen(false)}
        latencyMs={latencyMs}
      />

      <NotificationSettingsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNotificationTriggered={() => {
          setNotifications(notifService.getNotifications());
          setMetricsLogs(metricsTracker.getLogs());
        }}
      />

      <ThemeSettingsModal
        isOpen={isThemeSettingsOpen}
        onClose={() => setIsThemeSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
