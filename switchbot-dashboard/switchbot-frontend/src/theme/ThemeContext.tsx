import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const chartColors: Record<Theme, {
  line: string;
  activeDot: string;
  grid: string;
  tick: string;
  tooltipBg: string;
  tooltipText: string;
}> = {
  light: {
    line: '#d9534f',
    activeDot: '#5bc0de',
    grid: 'rgba(0,0,0,0.05)',
    tick: '#777',
    tooltipBg: '#fff',
    tooltipText: '#333',
  },
  dark: {
    line: '#ff7b72',
    activeDot: '#5bc0de',
    grid: 'rgba(255,255,255,0.08)',
    tick: '#9aa4b2',
    tooltipBg: '#202938',
    tooltipText: '#f0f3f6',
  },
};

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')) }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
