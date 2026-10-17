import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Send,
  Calendar,
  Smartphone
} from 'lucide-react';
import { NotificationService, type AppNotification } from '../utils/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationTriggered?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onNotificationTriggered
}) => {
  const notifService = NotificationService.getInstance();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [scheduledReminders, setScheduledReminders] = useState<AppNotification[]>([]);

  // New Reminder form state
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [delayMinutes, setDelayMinutes] = useState<number>(5);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPermission(notifService.getPermission());
      setNotifications(notifService.getNotifications());
      setScheduledReminders(notifService.getScheduledReminders());
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const res = await notifService.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      await notifService.sendNotification(
        'Push-Benachrichtigungen aktiviert!',
        'Sie erhalten ab sofort wichtige P2P-Updates und Erinnerungen.',
        'system'
      );
      setNotifications(notifService.getNotifications());
      onNotificationTriggered?.();
    }
  };

  const handleSendTestNotification = async () => {
    await notifService.sendNotification(
      'LinkPair Test-Meldung',
      'Dies ist eine Bestätigung: Push-Benachrichtigungen funktionieren einwandfrei!',
      'system'
    );
    setNotifications(notifService.getNotifications());
    setFeedbackMsg('Test-Meldung gesendet!');
    setTimeout(() => setFeedbackMsg(''), 3000);
    onNotificationTriggered?.();
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    notifService.scheduleReminder(
      customTitle.trim(),
      customBody.trim() || 'Geplante LinkPair Erinnerung',
      delayMinutes,
      'reminder'
    );

    setScheduledReminders(notifService.getScheduledReminders());
    setCustomTitle('');
    setCustomBody('');
    setFeedbackMsg(`Erinnerung für in ${delayMinutes} Minute(n) geplant!`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handlePresetReminder = (title: string, body: string, mins: number) => {
    notifService.scheduleReminder(title, body, mins, 'reminder');
    setScheduledReminders(notifService.getScheduledReminders());
    setFeedbackMsg(`Erinnerung "${title}" für in ${mins} Min geplant!`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleCancelReminder = (id: string) => {
    notifService.cancelReminder(id);
    setScheduledReminders(notifService.getScheduledReminders());
  };

  const handleClearHistory = () => {
    notifService.clearNotifications();
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Push-Benachrichtigungen & Erinnerungssystem
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    permission === 'granted'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {permission === 'granted' ? 'Aktiviert' : 'Nicht aktiv'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Benachrichtigungen bei eingehenden Dateien, Anrufen und zeitgesteuerten Erinnerungen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {feedbackMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Permission Status Box */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white flex items-center space-x-1.5">
                <span>Browser- & Systemberechtigung</span>
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Erlaubt LinkPair, Sie auch bei geschlossenem Browser oder im Hintergrund über eingehende P2P-Nachrichten zu informieren.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {permission !== 'granted' ? (
                <button
                  onClick={handleRequestPermission}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs shadow-md transition active:scale-95 flex items-center space-x-1.5"
                >
                  <Bell className="w-4 h-4" />
                  <span>Jetzt aktivieren</span>
                </button>
              ) : (
                <button
                  onClick={handleSendTestNotification}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition active:scale-95 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Test-Meldung senden</span>
                </button>
              )}
            </div>
          </div>

          {/* Scheduled Reminders Form & Presets */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Erinnerung oder Update-Planer erstellen</span>
            </h3>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400">Schnell-Vorlagen:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    handlePresetReminder('P2P Verbindung prüfen', 'Überprüfen Sie Ihre aktive Kopplung zu Partnergeräten', 5)
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition"
                >
                  ⚡ In 5 Min: Verbindung prüfen
                </button>
                <button
                  onClick={() =>
                    handlePresetReminder('Sicherheits-Audit', 'Turnusmäßige DTLS 1.3 Verschlüsselungs-Verifikation durchführen', 15)
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition"
                >
                  🛡️ In 15 Min: Sicherheits-Audit
                </button>
                <button
                  onClick={() =>
                    handlePresetReminder('Dateitransfer abschließen', 'Prüfen Sie, ob alle Downloads beendet sind', 30)
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition"
                >
                  📁 In 30 Min: Transfer-Check
                </button>
              </div>
            </div>

            {/* Custom Reminder Form */}
            <form onSubmit={handleCreateReminder} className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400">Titel der Erinnerung</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="z.B. Gerät erneut verbinden"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Zeitverzögerung</label>
                <select
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value={1}>In 1 Minute</option>
                  <option value={5}>In 5 Minuten</option>
                  <option value={15}>In 15 Minuten</option>
                  <option value={30}>In 30 Minuten</option>
                  <option value={60}>In 1 Stunde</option>
                  <option value={120}>In 2 Stunden</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!customTitle.trim()}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold disabled:opacity-40 transition shadow-md flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Planen</span>
                </button>
              </div>
            </form>

            {/* Active Scheduled Reminders */}
            {scheduledReminders.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Aktive Timer ({scheduledReminders.length})
                </span>
                <div className="space-y-2">
                  {scheduledReminders.map((rem) => {
                    const remainingMins = Math.max(1, Math.round(((rem.scheduledFor || 0) - Date.now()) / 60000));
                    return (
                      <div
                        key={rem.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white block">{rem.title}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Fällig in ca. {remainingMins} Min ({new Date(rem.scheduledFor || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </div>
                        <button
                          onClick={() => handleCancelReminder(rem.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Erinnerung abbrechen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notification History Tray */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Benachrichtigungs-Verlauf ({notifications.length})</span>
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-rose-400 hover:text-rose-300 transition"
                >
                  Verlauf leeren
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Keine Benachrichtigungen im Verlauf.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-white">{n.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{n.body}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono capitalize">
                      {n.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Unterstützt Android Systemleiste & Browser Notifications</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
