import { useCallback, useEffect, useState } from 'react';

function readInitialTheme(): boolean {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark') return true;
  if (storedTheme === 'light') return false;
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
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggle };
}
