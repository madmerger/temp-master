import type { TimeScale } from '../types';

// 自動リフレッシュ間隔（ミリ秒）
export const REFRESH_INTERVAL = 30000;

// 「未更新のメーター」と判定する閾値（7日）
export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

// タイムスケール選択肢（既定は 'day'）
export const TIME_SCALE_OPTIONS: ReadonlyArray<{ value: TimeScale; label: string }> = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

export const DEFAULT_TIME_SCALE: TimeScale = 'day';
