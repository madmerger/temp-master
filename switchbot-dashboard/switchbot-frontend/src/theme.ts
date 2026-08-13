export type Theme = 'light' | 'dark' | 'high-contrast' | 'industrial'

// Keep theme names, colors, and storage key in sync with index.html.
export const themes: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast' },
  { value: 'industrial', label: 'Industrial' },
]

export const themeColors: Record<Theme, string> = {
  light: '#f4f7fb',
  dark: '#101923',
  'high-contrast': '#000000',
  industrial: '#263238',
}

export const chartColors: Record<Theme, { line: string; grid: string; axis: string; tooltip: string }> = {
  light: {
    line: '#d94841',
    grid: '#d8e0ea',
    axis: '#5c6b7a',
    tooltip: '#ffffff',
  },
  dark: {
    line: '#ff8178',
    grid: '#3b4a5b',
    axis: '#c6d0dc',
    tooltip: '#172231',
  },
  'high-contrast': {
    line: '#ffea00',
    grid: '#52606d',
    axis: '#ffffff',
    tooltip: '#000000',
  },
  industrial: {
    line: '#f39c12',
    grid: '#51616b',
    axis: '#d9e1e5',
    tooltip: '#253238',
  },
}
