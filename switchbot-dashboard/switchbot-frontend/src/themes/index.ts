import { createTheme, type ThemeOptions } from '@mui/material/styles';
import type { ThemeName } from '../types';

interface ChartColors {
  temperature: string;
  temperatureFill: string;
  humidity: string;
  humidityFill: string;
  grid: string;
  text: string;
  tooltip: string;
  tooltipText: string;
}

declare module '@mui/material/styles' {
  interface Theme {
    chart: ChartColors;
  }
  interface ThemeOptions {
    chart?: ChartColors;
  }
}

const darkOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
  chart: {
    temperature: '#ef5350',
    temperatureFill: 'rgba(239,83,80,0.15)',
    humidity: '#42a5f5',
    humidityFill: 'rgba(66,165,245,0.15)',
    grid: 'rgba(255,255,255,0.06)',
    text: '#aaa',
    tooltip: '#333',
    tooltipText: '#fff',
  },
};

const lightOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#d32f2f' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  chart: {
    temperature: '#d32f2f',
    temperatureFill: 'rgba(211,47,47,0.12)',
    humidity: '#1976d2',
    humidityFill: 'rgba(25,118,210,0.12)',
    grid: 'rgba(0,0,0,0.06)',
    text: '#666',
    tooltip: '#fff',
    tooltipText: '#333',
  },
};

const oceanOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#4dd0e1' },
    secondary: { main: '#80deea' },
    background: { default: '#0a1929', paper: '#0d2137' },
    text: { primary: '#e0f7fa', secondary: '#80cbc4' },
  },
  chart: {
    temperature: '#ff8a65',
    temperatureFill: 'rgba(255,138,101,0.18)',
    humidity: '#4dd0e1',
    humidityFill: 'rgba(77,208,225,0.18)',
    grid: 'rgba(77,208,225,0.08)',
    text: '#80cbc4',
    tooltip: '#0d2137',
    tooltipText: '#e0f7fa',
  },
};

const sunsetOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#ff7043' },
    secondary: { main: '#ab47bc' },
    background: { default: '#1a0a2e', paper: '#2d1b4e' },
    text: { primary: '#fce4ec', secondary: '#f8bbd0' },
  },
  chart: {
    temperature: '#ff7043',
    temperatureFill: 'rgba(255,112,67,0.2)',
    humidity: '#ce93d8',
    humidityFill: 'rgba(206,147,216,0.2)',
    grid: 'rgba(255,112,67,0.08)',
    text: '#f8bbd0',
    tooltip: '#2d1b4e',
    tooltipText: '#fce4ec',
  },
};

const forestOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#66bb6a' },
    secondary: { main: '#a5d6a7' },
    background: { default: '#1b2a1b', paper: '#2e3d2e' },
    text: { primary: '#e8f5e9', secondary: '#a5d6a7' },
  },
  chart: {
    temperature: '#ff8a65',
    temperatureFill: 'rgba(255,138,101,0.18)',
    humidity: '#66bb6a',
    humidityFill: 'rgba(102,187,106,0.18)',
    grid: 'rgba(102,187,106,0.08)',
    text: '#a5d6a7',
    tooltip: '#2e3d2e',
    tooltipText: '#e8f5e9',
  },
};

const themeMap: Record<ThemeName, ThemeOptions> = {
  dark: darkOptions,
  light: lightOptions,
  ocean: oceanOptions,
  sunset: sunsetOptions,
  forest: forestOptions,
};

export const themeNames: ThemeName[] = ['dark', 'light', 'ocean', 'sunset', 'forest'];

export const themeLabels: Record<ThemeName, string> = {
  dark: 'Dark',
  light: 'Light',
  ocean: 'Ocean',
  sunset: 'Sunset',
  forest: 'Forest',
};

export const themeSwatchColors: Record<ThemeName, string> = {
  dark: '#121212',
  light: '#f5f5f5',
  ocean: '#0a1929',
  sunset: '#1a0a2e',
  forest: '#1b2a1b',
};

export function buildTheme(name: ThemeName) {
  const options = themeMap[name];
  return createTheme({
    ...options,
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}
