import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { ThemeProvider as MuiThemeProvider, type Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import darkTheme from './dark';
import lightTheme from './light';
import oceanTheme from './ocean';
import sunsetTheme from './sunset';
import forestTheme from './forest';

export type ThemeName = 'dark' | 'light' | 'ocean' | 'sunset' | 'forest';

export interface ThemeOption {
  name: ThemeName;
  label: string;
  colors: [string, string, string];
}

export const THEME_OPTIONS: ThemeOption[] = [
  { name: 'dark', label: 'Dark', colors: ['#121212', '#1e1e1e', '#00e5ff'] },
  { name: 'light', label: 'Light', colors: ['#f5f5f5', '#ffffff', '#1976d2'] },
  { name: 'ocean', label: 'Ocean', colors: ['#0a1929', '#132f4c', '#26c6da'] },
  { name: 'sunset', label: 'Sunset', colors: ['#1a0a2e', '#2d1b4e', '#ff6b35'] },
  { name: 'forest', label: 'Forest', colors: ['#0d1f0d', '#1b3a1b', '#76ff03'] },
];

const THEMES: Record<ThemeName, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  forest: forestTheme,
};

const STORAGE_KEY = 'temp-master-theme';

function loadTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in THEMES) return stored as ThemeName;
  } catch {
    // SSR or private browsing
  }
  return 'dark';
}

interface ThemeContextValue {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'dark',
  setThemeName: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>(loadTheme);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // ignore
    }
  }, []);

  const theme = useMemo(() => THEMES[themeName], [themeName]);

  const value = useMemo(
    () => ({ themeName, setThemeName }),
    [themeName, setThemeName],
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
