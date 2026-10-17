export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  category: 'p2p' | 'security' | 'transfer' | 'reminder' | 'system' | 'chat' | 'call';
  read: boolean;
  scheduledFor?: number;
}

export interface ReminderPreset {
  id: string;
  title: string;
  body: string;
  delayMinutes: number;
  category: AppNotification['category'];
}

const STORAGE_KEY = 'linkpair_notifications';
const REMINDERS_KEY = 'linkpair_scheduled_reminders';

export class NotificationService {
  private static instance: NotificationService;
  private remindersCheckTimer: any = null;

  public onNewNotification?: (notif: AppNotification) => void;

  private constructor() {
    this.startRemindersWatcher();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch {
      return 'denied';
    }
  }

  public getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveNotification(notif: AppNotification) {
    const list = this.getNotifications();
    const updated = [notif, ...list.slice(0, 49)];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    this.onNewNotification?.(notif);
  }

  public markAsRead(id: string) {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  public markAllAsRead() {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  public clearNotifications() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  public async sendNotification(
    title: string,
    body: string,
    category: AppNotification['category'] = 'system'
  ): Promise<boolean> {
    const notif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      timestamp: Date.now(),
      category,
      read: false
    };

    this.saveNotification(notif);

    if (this.getPermission() !== 'granted') {
      return false;
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { url: '/' }
          });
          return true;
        }
      }

      new Notification(title, {
        body,
        icon: '/icon-192.png'
      });
      return true;
    } catch (e) {
      console.warn('Native notification failed, falling back:', e);
      return false;
    }
  }

  public scheduleReminder(
    title: string,
    body: string,
    delayMinutes: number,
    category: AppNotification['category'] = 'reminder'
  ): AppNotification {
    const scheduledTime = Date.now() + delayMinutes * 60 * 1000;
    const item: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      timestamp: Date.now(),
      scheduledFor: scheduledTime,
      category,
      read: false
    };

    const scheduled = this.getScheduledReminders();
    scheduled.push(item);
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(scheduled));
    } catch {}

    return item;
  }

  public getScheduledReminders(): AppNotification[] {
    try {
      const data = localStorage.getItem(REMINDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public cancelReminder(id: string) {
    const list = this.getScheduledReminders().filter((r) => r.id !== id);
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(list));
    } catch {}
  }

  private startRemindersWatcher() {
    if (typeof window === 'undefined') return;
    this.remindersCheckTimer = setInterval(() => {
      const now = Date.now();
      const list = this.getScheduledReminders();
      const pending: AppNotification[] = [];

      for (const item of list) {
        if (item.scheduledFor && item.scheduledFor <= now) {
          // Trigger notification
          this.sendNotification(item.title, item.body, item.category);
        } else {
          pending.push(item);
        }
      }

      if (pending.length !== list.length) {
        try {
          localStorage.setItem(REMINDERS_KEY, JSON.stringify(pending));
        } catch {}
      }
    }, 5000);
  }
}
