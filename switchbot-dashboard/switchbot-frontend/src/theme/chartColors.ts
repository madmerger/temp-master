import type { Theme } from './themeTypes';

export const chartColors: Record<
  Theme,
  { grid: string; ticks: string; tooltipBackground: string; tooltipText: string }
> = {
  light: {
    grid: 'rgba(0, 0, 0, 0.05)',
    ticks: '#777',
    tooltipBackground: '#fff',
    tooltipText: '#333',
  },
  dark: {
    grid: 'rgba(255, 255, 255, 0.08)',
    ticks: '#94a3b8',
    tooltipBackground: '#0f172a',
    tooltipText: '#e2e8f0',
  },
};
