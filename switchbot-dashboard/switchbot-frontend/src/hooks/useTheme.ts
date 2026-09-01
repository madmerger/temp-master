import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'temp-master-theme';

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function initialTheme(): Theme {
  // localStorage はブラウザ設定によって SecurityError を投げる場合がある
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // 読み出せない場合は OS の設定へフォールバックする
  }
  // 初回は OS の設定を尊重する
  return prefersDark() ? 'dark' : 'light';
}

/** ダークモードの状態を localStorage に永続化しつつ html の class を切り替える */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // 保存できなくてもテーマの切替と表示は継続する
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
