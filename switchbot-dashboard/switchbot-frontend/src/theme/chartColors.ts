import type { Theme } from './ThemeContext'

export interface ChartColors {
  line: string
  fill: string
  grid: string
  axis: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

export function getChartColors(theme: Theme): ChartColors {
  if (theme === 'dark') {
    return {
      line: '#ff7a7a',
      fill: 'rgba(255, 122, 122, 0.15)',
      grid: 'rgba(255, 255, 255, 0.08)',
      axis: '#9aa4b2',
      tooltipBg: '#1e2530',
      tooltipBorder: '#33405a',
      tooltipText: '#e6e9ef',
    }
  }
  return {
    line: '#d9534f',
    fill: 'rgba(217, 83, 79, 0.15)',
    grid: 'rgba(0, 0, 0, 0.06)',
    axis: '#777777',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e0e0e0',
    tooltipText: '#333333',
  }
}
