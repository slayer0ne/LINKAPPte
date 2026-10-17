import React from 'react';
import {
  Palette,
  Sun,
  Moon,
  Contrast,
  Laptop,
  Check,
  X,
  Eye,
  Sliders,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    theme,
    effectiveTheme,
    setTheme,
    highContrastEnabled,
    setHighContrastEnabled,
    reducedMotion,
    setReducedMotion
  } = useTheme();

  if (!isOpen) return null;

  const themes: {
    id: ThemeMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    previewBg: string;
    previewSurface: string;
    previewAccent: string;
    badge?: string;
  }[] = [
    {
      id: 'dark',
      title: 'Obsidian Dark',
      description: 'Dunkles P2P Cyberpunk-Design mit tiefem Schiefer und Cyan-Akzenten.',
      icon: <Moon className="w-5 h-5 text-cyan-400" />,
      previewBg: 'bg-slate-950',
      previewSurface: 'bg-slate-900 border border-slate-800',
      previewAccent: 'bg-cyan-500'
    },
    {
      id: 'light',
      title: 'Material 3 Light (Google)',
      description: 'Google Material You Design: Heller, augenschonender Hintergrund mit exzellenter Lesbarkeit.',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      previewBg: 'bg-slate-100',
      previewSurface: 'bg-white border border-slate-300 shadow-sm',
      previewAccent: 'bg-blue-600',
      badge: 'Material 3'
    },
    {
      id: 'high-contrast',
      title: 'High-Contrast Pro (WCAG AAA)',
      description: 'Maximaler Kontrast mit reinem Weiß, schwarzer Typografie und verstärkten 2px-Rändern.',
      icon: <Contrast className="w-5 h-5 text-purple-400" />,
      previewBg: 'bg-white',
      previewSurface: 'bg-slate-50 border-2 border-black',
      previewAccent: 'bg-black',
      badge: 'Barrierefrei'
    },
    {
      id: 'system',
      title: 'Systemstandard',
      description: 'Passt sich automatisch den Einstellungen Ihres Smartphones oder Betriebssystems an.',
      icon: <Laptop className="w-5 h-5 text-emerald-400" />,
      previewBg: 'bg-gradient-to-r from-slate-950 to-slate-200',
      previewSurface: 'bg-slate-800/80 border border-slate-700',
      previewAccent: 'bg-cyan-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/40">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Design- & Design-System Einstellungen
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Google M3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Wählen Sie zwischen Obsidian Dark und barrierefreiem Google Material Light
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
          {/* Theme Selection Cards */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Farbschema auswählen
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 relative ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          {t.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="text-xs font-bold text-white">{t.title}</h4>
                            {t.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300">
                                {t.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>

                    {/* Miniature Theme Preview Bar */}
                    <div className={`w-full h-8 rounded-xl ${t.previewBg} p-1.5 flex items-center justify-between border border-slate-800/40`}>
                      <div className={`h-full w-2/3 rounded-lg ${t.previewSurface}`} />
                      <div className={`h-4 w-4 rounded-full ${t.previewAccent}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Barrierefreiheit & Lesbarkeit (WCAG 2.1)</span>
            </h3>

            <div className="space-y-3">
              {/* High Contrast Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">
                    Kontrastverstärkung erzwingen
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Verstärkt Konturen, Schriftgewichte und Ränder für leichtere Erkennbarkeit
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={highContrastEnabled}
                  onChange={(e) => setHighContrastEnabled(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Reduced Motion Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">
                    Reduzierte Bewegung (Reduced Motion)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Deaktiviert Hintergrund-Animationen und Pulse-Effekte
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Aktiver Modus: <strong className="text-white capitalize">{effectiveTheme}</strong></span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-md transition"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
