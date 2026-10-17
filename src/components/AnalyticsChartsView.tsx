import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  ArrowUpDown,
  Filter,
  Download,
  Search,
  PieChart,
  BarChart3,
  Layers,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { MetricLogEntry } from '../utils/metricsTracker';

interface AnalyticsChartsViewProps {
  logs: MetricLogEntry[];
  currentLatencyMs: number;
}

export const AnalyticsChartsView: React.FC<AnalyticsChartsViewProps> = ({
  logs,
  currentLatencyMs
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '5m' | '1h' | 'today'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'timestamp' | 'value' | 'category'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ x: number; y: number; val: number; label: string } | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    return logs.filter((log) => {
      // Timeframe
      if (selectedTimeframe === '5m' && now - log.timestamp > 5 * 60 * 1000) return false;
      if (selectedTimeframe === '1h' && now - log.timestamp > 60 * 60 * 1000) return false;
      if (selectedTimeframe === 'today' && now - log.timestamp > 24 * 60 * 60 * 1000) return false;

      // Category
      if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return log.title.toLowerCase().includes(q) || log.detail.toLowerCase().includes(q);
      }

      return true;
    });
  }, [logs, selectedTimeframe, selectedCategory, searchQuery]);

  // Sorted logs
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let diff = 0;
      if (sortField === 'timestamp') {
        diff = a.timestamp - b.timestamp;
      } else if (sortField === 'value') {
        diff = a.value - b.value;
      } else if (sortField === 'category') {
        diff = a.category.localeCompare(b.category);
      }
      return sortOrder === 'desc' ? -diff : diff;
    });
  }, [filteredLogs, sortField, sortOrder]);

  // Compute Latency chart series
  const latencyPoints = useMemo(() => {
    const pts = logs
      .filter((l) => l.category === 'latency')
      .slice(-16)
      .map((l) => ({ val: l.value, time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }));

    if (pts.length === 0) {
      // Fallback points with currentLatency
      const base = currentLatencyMs > 0 ? currentLatencyMs : 12;
      return [
        { val: base + 2, time: '12:00' },
        { val: base - 1, time: '12:01' },
        { val: base, time: '12:02' },
        { val: base + 1, time: '12:03' },
        { val: base - 2, time: '12:04' },
        { val: base, time: '12:05' }
      ];
    }
    return pts;
  }, [logs, currentLatencyMs]);

  // Latency Stats
  const latencyStats = useMemo(() => {
    const vals = latencyPoints.map((p) => p.val);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    return { min, max, avg };
  }, [latencyPoints]);

  // Category breakdown for Donut Chart
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {
      transfer: 0,
      latency: 0,
      security: 0,
      chat: 0,
      notification: 0
    };
    logs.forEach((l) => {
      if (counts[l.category] !== undefined) {
        counts[l.category]++;
      } else {
        counts[l.category] = 1;
      }
    });
    const total = Math.max(1, logs.length);
    return Object.entries(counts).map(([cat, count]) => ({
      cat,
      count,
      pct: Math.round((count / total) * 100)
    }));
  }, [logs]);

  // Category colors and labels
  const catMeta: Record<string, { label: string; color: string; bg: string }> = {
    transfer: { label: 'Dateitransfer', color: '#06b6d4', bg: 'bg-cyan-500' },
    latency: { label: 'Latenz (Ping)', color: '#3b82f6', bg: 'bg-blue-500' },
    security: { label: 'Sicherheit/DTLS', color: '#10b981', bg: 'bg-emerald-500' },
    chat: { label: 'P2P Chat', color: '#8b5cf6', bg: 'bg-purple-500' },
    notification: { label: 'Push & Reminder', color: '#f59e0b', bg: 'bg-amber-500' },
    call: { label: 'Audio/Video', color: '#ec4899', bg: 'bg-pink-500' }
  };

  const handleExportCSV = () => {
    const headers = ['Zeitstempel', 'Kategorie', 'Titel', 'Details', 'Wert', 'Einheit', 'Status'];
    const rows = sortedLogs.map((l) => [
      new Date(l.timestamp).toISOString(),
      l.category,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.detail.replace(/"/g, '""')}"`,
      l.value,
      l.unit,
      l.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LinkPair-Metrics-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Geometry
  const chartWidth = 600;
  const chartHeight = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(30, ...latencyPoints.map((p) => p.val)) * 1.3;
  const minVal = 0;

  const points = latencyPoints.map((pt, idx) => {
    const x = padding.left + (idx / Math.max(1, latencyPoints.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((pt.val - minVal) / (maxVal - minVal)) * innerHeight;
    return { x, y, val: pt.val, label: pt.time };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` +
      points
        .slice(1)
        .map((p, i) => {
          const prev = points[i];
          const cx1 = prev.x + (p.x - prev.x) / 2;
          const cy1 = prev.y;
          const cx2 = prev.x + (p.x - prev.x) / 2;
          const cy2 = p.y;
          return `C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
        })
        .join(' ')
    : '';

  const areaD = pathD
    ? `${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`
    : '';

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-y-auto shadow-xl p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Interaktive P2P Metriken & Datenanalyse</span>
            </h2>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full font-mono">
              Live Graphs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Echtzeit-Visualisierung von Latenz (Ping), Transfer-Geschwindigkeit, Paketverteilung und Sicherheits-Events.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95 self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Daten als CSV exportieren</span>
        </button>
      </div>

      {/* Top Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Latency Graph (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>P2P Latenz- & RTT-Verlauf (ms)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Direkte WebRTC-Verbindung • Niedrigere Werte bedeuten schnellere Reaktionszeit
              </p>
            </div>

            {/* Stats badges */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Min: <span className="text-emerald-400 font-bold">{latencyStats.min} ms</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Ø: <span className="text-cyan-400 font-bold">{latencyStats.avg} ms</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Max: <span className="text-amber-400 font-bold">{latencyStats.max} ms</span>
              </span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full overflow-x-auto relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 select-none"
              onMouseLeave={() => setHoveredDataPoint(null)}
            >
              <defs>
                <linearGradient id="latencyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="latencyLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + innerHeight * ratio;
                const val = Math.round(maxVal - (maxVal - minVal) * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Filled Area */}
              {areaD && <path d={areaD} fill="url(#latencyAreaGrad)" />}

              {/* Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#latencyLineGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Points */}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredDataPoint?.x === pt.x ? 5 : 3}
                    fill="#ffffff"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredDataPoint(pt)}
                  />
                  {/* Bottom Labels */}
                  {i % 3 === 0 && (
                    <text
                      x={pt.x}
                      y={chartHeight - 10}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              ))}

              {/* Hover Tooltip Overlay */}
              {hoveredDataPoint && (
                <g>
                  <line
                    x1={hoveredDataPoint.x}
                    y1={padding.top}
                    x2={hoveredDataPoint.x}
                    y2={padding.top + innerHeight}
                    stroke="#06b6d4"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x={Math.min(chartWidth - 90, Math.max(10, hoveredDataPoint.x - 40))}
                    y={Math.max(5, hoveredDataPoint.y - 32)}
                    width="80"
                    height="26"
                    rx="6"
                    fill="#0f172a"
                    stroke="#06b6d4"
                    strokeWidth="1"
                  />
                  <text
                    x={Math.min(chartWidth - 50, Math.max(50, hoveredDataPoint.x))}
                    y={Math.max(22, hoveredDataPoint.y - 15)}
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {hoveredDataPoint.val} ms
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Right: Category Breakdown Donut / Stats */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <span>Aktivitäts-Verteilung</span>
            </h3>
            <p className="text-[11px] text-slate-400">Aufteilung der P2P Ereignisse</p>
          </div>

          <div className="space-y-3">
            {categoryStats.map((item) => {
              const meta = catMeta[item.cat] || { label: item.cat, color: '#94a3b8', bg: 'bg-slate-500' };
              return (
                <div key={item.cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 flex items-center space-x-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${meta.bg}`} />
                      <span>{meta.label}</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      {item.count} <span className="text-slate-500">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Client-Side Log: Keine Daten verlassen das Gerät</span>
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Einträge filtern (z.B. DTLS, Ping, Datei)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedTimeframe('all')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedTimeframe === 'all' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setSelectedTimeframe('5m')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedTimeframe === '5m' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              5 Min
            </button>
            <button
              onClick={() => setSelectedTimeframe('1h')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedTimeframe === '1h' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              1 Std
            </button>
            <button
              onClick={() => setSelectedTimeframe('today')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedTimeframe === 'today' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Heute
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Alle Kategorien</option>
              <option value="latency">Latenz / Ping</option>
              <option value="transfer">Dateitransfer</option>
              <option value="security">Sicherheit / DTLS</option>
              <option value="notification">Push & Reminders</option>
              <option value="chat">P2P Chat</option>
            </select>
          </div>

          {/* Sort Field & Order */}
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => {
                if (sortField === 'timestamp') {
                  setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                } else {
                  setSortField('timestamp');
                  setSortOrder('desc');
                }
              }}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl border transition ${
                sortField === 'timestamp'
                  ? 'bg-slate-800 text-cyan-300 border-cyan-700/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Zeit {sortField === 'timestamp' && (sortOrder === 'desc' ? '↓' : '↑')}</span>
            </button>

            <button
              onClick={() => {
                if (sortField === 'value') {
                  setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                } else {
                  setSortField('value');
                  setSortOrder('desc');
                }
              }}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl border transition ${
                sortField === 'value'
                  ? 'bg-slate-800 text-cyan-300 border-cyan-700/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Messwert {sortField === 'value' && (sortOrder === 'desc' ? '↓' : '↑')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Zeitstempel</th>
                <th className="py-3 px-4">Kategorie</th>
                <th className="py-3 px-4">Ereignis / Metrik</th>
                <th className="py-3 px-4">Detail</th>
                <th className="py-3 px-4 text-right">Wert</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    Keine Metriken für die ausgewählten Filter gefunden.
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => {
                  const meta = catMeta[log.category] || { label: log.category, color: '#94a3b8', bg: 'bg-slate-500' };
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-sans">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            color: meta.color,
                            backgroundColor: `${meta.color}20`,
                            border: `1px solid ${meta.color}40`
                          }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans font-medium text-white">{log.title}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-400 truncate max-w-xs">{log.detail}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-cyan-300 whitespace-nowrap">
                        {log.value} <span className="text-[10px] text-slate-400 font-normal">{log.unit}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {log.status === 'optimal' && (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Optimal</span>
                          </span>
                        )}
                        {log.status === 'warning' && (
                          <span className="inline-flex items-center space-x-1 text-amber-400 text-[10px] bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
                            <AlertCircle className="w-3 h-3" />
                            <span>Hinweis</span>
                          </span>
                        )}
                        {log.status === 'normal' && (
                          <span className="inline-flex items-center space-x-1 text-slate-400 text-[10px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                            <span>Aktiv</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
