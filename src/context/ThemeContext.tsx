import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'high-contrast' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: 'dark' | 'light' | 'high-contrast';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  highContrastEnabled: boolean;
  setHighContrastEnabled: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'linkpair_theme_mode';
const HIGH_CONTRAST_KEY = 'linkpair_high_contrast';
const REDUCED_MOTION_KEY = 'linkpair_reduced_motion';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored) return stored;
    }
    return 'dark';
  });

  const [highContrastEnabled, setHighContrastEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(HIGH_CONTRAST_KEY) === 'true';
    }
    return false;
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REDUCED_MOTION_KEY) === 'true';
    }
    return false;
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const effectiveTheme: 'dark' | 'light' | 'high-contrast' =
    theme === 'system'
      ? systemIsDark
        ? 'dark'
        : 'light'
      : highContrastEnabled || theme === 'high-contrast'
      ? 'high-contrast'
      : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'high-contrast');

    if (effectiveTheme === 'high-contrast') {
      root.classList.add('light', 'high-contrast');
    } else if (effectiveTheme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }
  }, [effectiveTheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {}
  };

  const toggleTheme = () => {
    if (effectiveTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const setHighContrastEnabled = (enabled: boolean) => {
    setHighContrastEnabledState(enabled);
    try {
      localStorage.setItem(HIGH_CONTRAST_KEY, enabled ? 'true' : 'false');
    } catch {}
  };

  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
    try {
      localStorage.setItem(REDUCED_MOTION_KEY, enabled ? 'true' : 'false');
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
        highContrastEnabled,
        setHighContrastEnabled,
        reducedMotion,
        setReducedMotion
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
