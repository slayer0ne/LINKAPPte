export interface MetricLogEntry {
  id: string;
  timestamp: number;
  category: 'latency' | 'transfer' | 'chat' | 'call' | 'security' | 'notification';
  title: string;
  detail: string;
  value: number; // e.g. latency in ms, bytes transferred, call seconds
  unit: string;
  status: 'optimal' | 'warning' | 'normal' | 'error';
}

const METRICS_KEY = 'linkpair_metrics_log';

export class MetricsTracker {
  private static instance: MetricsTracker;

  private constructor() {
    this.seedInitialMetricsIfEmpty();
  }

  public static getInstance(): MetricsTracker {
    if (!MetricsTracker.instance) {
      MetricsTracker.instance = new MetricsTracker();
    }
    return MetricsTracker.instance;
  }

  public getLogs(): MetricLogEntry[] {
    try {
      const data = localStorage.getItem(METRICS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addLog(entry: Omit<MetricLogEntry, 'id' | 'timestamp'>) {
    const list = this.getLogs();
    const item: MetricLogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    const updated = [item, ...list.slice(0, 199)]; // Keep up to 200 logs
    try {
      localStorage.setItem(METRICS_KEY, JSON.stringify(updated));
    } catch {}
  }

  public clearLogs() {
    try {
      localStorage.removeItem(METRICS_KEY);
    } catch {}
    this.seedInitialMetricsIfEmpty();
  }

  private seedInitialMetricsIfEmpty() {
    if (typeof window === 'undefined') return;
    const existing = this.getLogs();
    if (existing.length === 0) {
      const now = Date.now();
      const mockSeeds: MetricLogEntry[] = [
        {
          id: 'm1',
          timestamp: now - 180000,
          category: 'security',
          title: 'DTLS 1.3 Handshake',
          detail: 'Ende-zu-Ende Verschlüsselung initiiert',
          value: 1,
          unit: 'Audit',
          status: 'optimal'
        },
        {
          id: 'm2',
          timestamp: now - 150000,
          category: 'latency',
          title: 'STUN Candidate Reflexive',
          detail: 'NAT Traversal über Google STUN',
          value: 12,
          unit: 'ms',
          status: 'optimal'
        },
        {
          id: 'm3',
          timestamp: now - 120000,
          category: 'transfer',
          title: 'P2P Datenkanal geöffnet',
          detail: 'RTCDataChannel bereit für High-Speed',
          value: 64,
          unit: 'KB Chunk',
          status: 'optimal'
        },
        {
          id: 'm4',
          timestamp: now - 90000,
          category: 'latency',
          title: 'Live RTT Ping Messung',
          detail: 'Geringe Latenz im lokalen Segment',
          value: 9,
          unit: 'ms',
          status: 'optimal'
        },
        {
          id: 'm5',
          timestamp: now - 60000,
          category: 'transfer',
          title: 'Beispiel-Transfer Testdatei',
          detail: 'P2P Direktübertragung verifiziert',
          value: 4800,
          unit: 'KB',
          status: 'optimal'
        },
        {
          id: 'm6',
          timestamp: now - 30000,
          category: 'notification',
          title: 'Push-Service initialisiert',
          detail: 'Hintergrund-Reminders aktiv',
          value: 100,
          unit: '%',
          status: 'optimal'
        }
      ];
      try {
        localStorage.setItem(METRICS_KEY, JSON.stringify(mockSeeds));
      } catch {}
    }
  }
}
