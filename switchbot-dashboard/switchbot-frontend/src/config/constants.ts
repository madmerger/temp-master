export const REFRESH_INTERVAL = 30_000;

export const API_BASE_URL: string =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'https://temp-master.fly.dev'
    : (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export const TIME_SCALE_OPTIONS = [
  { value: 'hour' as const, label: 'Last Hour' },
  { value: 'day' as const, label: 'Last 24 Hours' },
  { value: 'week' as const, label: 'Last 7 Days' },
  { value: 'month' as const, label: 'Last 30 Days' },
  { value: 'year' as const, label: 'Last Year' },
] as const;
