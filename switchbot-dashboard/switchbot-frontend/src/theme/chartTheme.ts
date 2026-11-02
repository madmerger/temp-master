import type { Theme } from './ThemeContext'

export const CHART_THEME: Record<Theme, { grid: string; tick: string }> = {
  light: {
    grid: 'rgba(0, 0, 0, 0.05)',
    tick: '#777',
  },
  dark: {
    grid: 'rgba(255, 255, 255, 0.12)',
    tick: '#94a3b8',
  },
}
