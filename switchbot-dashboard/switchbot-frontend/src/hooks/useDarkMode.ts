import { useCallback, useEffect, useState } from 'react';

function readInitialTheme(): boolean {
  let storedTheme: string | null = null;
  try {
    storedTheme = localStorage.getItem('theme');
  } catch {
    // Storage may be unavailable; fall back to the system preference.
  }
  if (storedTheme === 'dark') return true;
  if (storedTheme === 'light') return false;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark((current) => {
      const next = !current;
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {
        // Storage may be unavailable, but the theme still changes in-session.
      }
      return next;
    });
  }, []);

  return { isDark, toggle };
}
