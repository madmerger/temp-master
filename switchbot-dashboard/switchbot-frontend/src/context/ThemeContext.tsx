import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { buildTheme } from '../themes';
import type { ThemeName } from '../types';

interface ThemeContextValue {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'dark',
  setThemeName: () => {},
});

const STORAGE_KEY = 'temp-master-theme';

function loadSavedTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['dark', 'light', 'ocean', 'sunset', 'forest'].includes(saved)) {
      return saved as ThemeName;
    }
  } catch {
    // localStorage unavailable
  }
  return 'dark';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>(loadSavedTheme);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // ignore
    }
  }, []);

  const theme = useMemo(() => buildTheme(themeName), [themeName]);

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

export function useThemeContext() {
  return useContext(ThemeContext);
}
