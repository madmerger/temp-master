import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import type { Theme } from './themeTypes';

function validTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem('theme');
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem('theme', theme);
  } catch {
    // Storage can be blocked (e.g. privacy mode); the choice then lasts for this page only.
  }
}

function initialTheme(): Theme {
  const storedTheme = readStoredTheme();
  if (validTheme(storedTheme)) {
    return storedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const explicitChoice = useRef(validTheme(readStoredTheme()));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      if (!explicitChoice.current) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      explicitChoice.current = true;
      writeStoredTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
