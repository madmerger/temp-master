import type { ThemeId } from '../types';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  vars: Record<string, string>;
}

const lightTheme: ThemeDefinition = {
  id: 'light',
  label: 'Light',
  vars: {
    '--bg-primary': '#f5f5f5',
    '--bg-surface': '#ffffff',
    '--bg-surface-hover': '#fafafa',
    '--bg-navbar': '#ffffff',
    '--text-primary': '#212121',
    '--text-secondary': '#757575',
    '--text-muted': '#9e9e9e',
    '--border-color': '#e0e0e0',
    '--accent-color': '#1976d2',
    '--accent-hover': '#1565c0',
    '--danger-color': '#d32f2f',
    '--danger-bg': 'rgba(211, 47, 47, 0.08)',
    '--info-color': '#0288d1',
    '--info-bg': 'rgba(2, 136, 209, 0.08)',
    '--success-color': '#388e3c',
    '--success-bg': 'rgba(56, 142, 60, 0.08)',
    '--warning-color': '#f57c00',
    '--warning-bg': 'rgba(245, 124, 0, 0.08)',
    '--chart-line': '#d32f2f',
    '--chart-fill': 'rgba(211, 47, 47, 0.12)',
    '--chart-grid': 'rgba(0, 0, 0, 0.06)',
    '--chart-tick': '#757575',
    '--shadow': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
    '--shadow-lg': '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
    '--radius': '8px',
  },
};

const darkTheme: ThemeDefinition = {
  id: 'dark',
  label: 'Dark',
  vars: {
    '--bg-primary': '#121212',
    '--bg-surface': '#1e1e1e',
    '--bg-surface-hover': '#2a2a2a',
    '--bg-navbar': '#1e1e1e',
    '--text-primary': '#e0e0e0',
    '--text-secondary': '#aaaaaa',
    '--text-muted': '#777777',
    '--border-color': '#333333',
    '--accent-color': '#90caf9',
    '--accent-hover': '#64b5f6',
    '--danger-color': '#ef5350',
    '--danger-bg': 'rgba(239, 83, 80, 0.15)',
    '--info-color': '#4fc3f7',
    '--info-bg': 'rgba(79, 195, 247, 0.15)',
    '--success-color': '#66bb6a',
    '--success-bg': 'rgba(102, 187, 106, 0.15)',
    '--warning-color': '#ffa726',
    '--warning-bg': 'rgba(255, 167, 38, 0.15)',
    '--chart-line': '#ef5350',
    '--chart-fill': 'rgba(239, 83, 80, 0.2)',
    '--chart-grid': 'rgba(255, 255, 255, 0.08)',
    '--chart-tick': '#aaaaaa',
    '--shadow': '0 1px 3px rgba(0,0,0,0.4)',
    '--shadow-lg': '0 4px 6px rgba(0,0,0,0.5)',
    '--radius': '8px',
  },
};

const industrialTheme: ThemeDefinition = {
  id: 'industrial',
  label: 'Industrial',
  vars: {
    '--bg-primary': '#1a1d23',
    '--bg-surface': '#22262e',
    '--bg-surface-hover': '#2a2f38',
    '--bg-navbar': '#14171c',
    '--text-primary': '#00ff41',
    '--text-secondary': '#00cc33',
    '--text-muted': '#008822',
    '--border-color': '#00ff4130',
    '--accent-color': '#00ff41',
    '--accent-hover': '#33ff66',
    '--danger-color': '#ff3333',
    '--danger-bg': 'rgba(255, 51, 51, 0.15)',
    '--info-color': '#00bfff',
    '--info-bg': 'rgba(0, 191, 255, 0.15)',
    '--success-color': '#00ff41',
    '--success-bg': 'rgba(0, 255, 65, 0.12)',
    '--warning-color': '#ffaa00',
    '--warning-bg': 'rgba(255, 170, 0, 0.15)',
    '--chart-line': '#00ff41',
    '--chart-fill': 'rgba(0, 255, 65, 0.15)',
    '--chart-grid': 'rgba(0, 255, 65, 0.1)',
    '--chart-tick': '#00cc33',
    '--shadow': '0 0 8px rgba(0, 255, 65, 0.1)',
    '--shadow-lg': '0 0 16px rgba(0, 255, 65, 0.15)',
    '--radius': '4px',
  },
};

export const THEMES: ThemeDefinition[] = [lightTheme, darkTheme, industrialTheme];

const STORAGE_KEY = 'temp-master-theme';

export function loadSavedThemeId(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved as ThemeId;
    }
  } catch {
    // localStorage unavailable
  }
  return 'light';
}

export function saveThemeId(id: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage unavailable
  }
}

export function applyTheme(theme: ThemeDefinition): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}

export function getThemeById(id: ThemeId): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}
