import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { ThemeContext, type Theme } from './themeContext';

interface ThemeState {
  theme: Theme;
  explicitChoice: boolean;
}

const STORAGE_KEY = 'temp-master-theme';

function getInitialState(): ThemeState {
  try {
    if (typeof window !== 'undefined') {
      const storedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return { theme: storedTheme, explicitChoice: true };
      }
    }
  } catch {
    // Storage may be disabled by the browser.
  }

  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return { theme: 'dark', explicitChoice: false };
    }
  } catch {
    // Use the light theme when system preferences are unavailable.
  }

  return { theme: 'light', explicitChoice: false };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(getInitialState);
  const explicitChoice = useRef(state.explicitChoice);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    try {
      if (typeof window.matchMedia !== 'function') {
        return;
      }
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateFromSystem = (event: MediaQueryListEvent) => {
        if (explicitChoice.current) {
          return;
        }
        const theme = event.matches ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
        setState({ theme, explicitChoice: false });
      };
      mediaQuery.addEventListener?.('change', updateFromSystem);
      return () => mediaQuery.removeEventListener?.('change', updateFromSystem);
    } catch {
      return;
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const theme = state.theme === 'dark' ? 'light' : 'dark';
    explicitChoice.current = true;
    document.documentElement.dataset.theme = theme;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, theme);
      }
    } catch {
      // Keep the in-memory choice when storage is unavailable.
    }
    setState({ theme, explicitChoice: true });
  }, [state.theme]);

  const value = useMemo(
    () => ({ theme: state.theme, toggleTheme }),
    [state.theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
