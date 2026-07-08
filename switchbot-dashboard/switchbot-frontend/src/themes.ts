export type ThemeId = 'light' | 'dark' | 'ocean' | 'sunset'

export interface ChartColors {
  line: string
  fill: string
  grid: string
  axis: string
  tooltipBg: string
  tooltipText: string
}

export interface ThemeMeta {
  id: ThemeId
  label: string
  chart: ChartColors
}

// The CSS custom properties for each theme live in themes.css (keyed by
// [data-theme=...]). The chart colors below are consumed by Recharts, which
// cannot read CSS variables directly, so they are mirrored here per theme.
export const THEMES: ThemeMeta[] = [
  {
    id: 'light',
    label: 'Light',
    chart: {
      line: '#d9534f',
      fill: 'rgba(217, 83, 79, 0.15)',
      grid: 'rgba(0, 0, 0, 0.08)',
      axis: '#777777',
      tooltipBg: '#ffffff',
      tooltipText: '#222222',
    },
  },
  {
    id: 'dark',
    label: 'Dark',
    chart: {
      line: '#ff7b72',
      fill: 'rgba(255, 123, 114, 0.20)',
      grid: 'rgba(255, 255, 255, 0.10)',
      axis: '#9aa4b2',
      tooltipBg: '#1c2333',
      tooltipText: '#e6edf3',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    chart: {
      line: '#22d3ee',
      fill: 'rgba(34, 211, 238, 0.18)',
      grid: 'rgba(148, 197, 216, 0.15)',
      axis: '#8ab6c9',
      tooltipBg: '#0b2a3a',
      tooltipText: '#d7f2fb',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    chart: {
      line: '#ffb347',
      fill: 'rgba(255, 179, 71, 0.20)',
      grid: 'rgba(255, 255, 255, 0.08)',
      axis: '#e8b9a0',
      tooltipBg: '#3a1f2b',
      tooltipText: '#ffe9d6',
    },
  },
]

export const THEME_IDS = THEMES.map((t) => t.id)

export const DEFAULT_THEME: ThemeId = 'light'

export function getTheme(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export function isThemeId(value: string | null): value is ThemeId {
  return value !== null && (THEME_IDS as string[]).includes(value)
}
