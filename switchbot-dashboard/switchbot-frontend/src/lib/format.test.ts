import { describe, expect, it } from 'vitest';
import { formatClock, formatTimestamp, pad2 } from './format';

// ローカルタイムゾーンに依存しないよう、ローカル時刻でテスト用の日時を組み立てる
const local = new Date(2026, 9, 22, 7, 5, 9);
const iso = local.toISOString();

describe('formatTimestamp', () => {
  it('hour / day は HH:MM', () => {
    expect(formatTimestamp(iso, 'hour')).toBe('07:05');
    expect(formatTimestamp(iso, 'day')).toBe('07:05');
  });

  it('week は 曜日 + 時', () => {
    expect(formatTimestamp(iso, 'week')).toBe('Thu 07');
  });

  it('month / year は 月 + 日', () => {
    expect(formatTimestamp(iso, 'month')).toBe('Oct 22');
    expect(formatTimestamp(iso, 'year')).toBe('Oct 22');
  });

  it('未知のスケールは toLocaleString', () => {
    expect(formatTimestamp(iso, 'unknown')).toBe(local.toLocaleString());
  });
});

describe('pad2 / formatClock', () => {
  it('2桁ゼロ埋め', () => {
    expect(pad2(3)).toBe('03');
    expect(pad2(12)).toBe('12');
    expect(formatClock(local)).toBe('07:05:09');
  });
});
