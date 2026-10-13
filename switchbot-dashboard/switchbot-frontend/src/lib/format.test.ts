import { describe, expect, it } from 'vitest';
import { getDisplayName } from '../config/displayNames';
import {
  formatTemperatureAxisTick,
  formatTimestamp,
  isStaleMeter,
  pad2,
} from './format';

describe('pad2', () => {
  it('pads one-digit values and preserves two-digit values', () => {
    expect(pad2(3)).toBe('03');
    expect(pad2(12)).toBe('12');
  });
});

describe('formatTemperatureAxisTick', () => {
  it('removes float noise while preserving meaningful decimals', () => {
    expect(formatTemperatureAxisTick(27.400000000000002)).toBe('27.4°');
    expect(formatTemperatureAxisTick(28)).toBe('28°');
  });
});

describe('formatTimestamp', () => {
  const date = new Date(2024, 0, 7, 9, 5);
  const timestamp = date.toISOString();

  it.each([
    ['hour', '09:05'],
    ['day', '09:05'],
    ['week', 'Sun 09'],
    ['month', 'Jan 7'],
    ['year', 'Jan 7'],
  ])('formats the %s time scale', (scale, expected) => {
    expect(formatTimestamp(timestamp, scale)).toBe(expected);
  });

  it('uses the default locale format for an unknown scale', () => {
    expect(formatTimestamp(timestamp, 'unknown')).toBe(date.toLocaleString());
  });
});

describe('isStaleMeter', () => {
  const now = Date.UTC(2025, 0, 8);
  const updated = (ageInDays: number) =>
    new Date(now - ageInDays * 24 * 60 * 60 * 1000).toISOString();

  it('treats missing and invalid update timestamps as stale', () => {
    expect(isStaleMeter({ last_updated: null }, now)).toBe(true);
    expect(isStaleMeter({ last_updated: 'not-a-date' }, now)).toBe(true);
  });

  it('keeps six-day-old and fresh meters active', () => {
    expect(isStaleMeter({ last_updated: updated(6) }, now)).toBe(false);
    expect(isStaleMeter({ last_updated: updated(0) }, now)).toBe(false);
  });

  it('marks a meter stale at the seven-day boundary', () => {
    expect(isStaleMeter({ last_updated: updated(7) }, now)).toBe(true);
  });
});

describe('getDisplayName', () => {
  it('returns the mapped name or the original name as a fallback', () => {
    expect(getDisplayName('Study Hub')).toBe('制御盤 (CP-1601)');
    expect(getDisplayName('Unknown Meter')).toBe('Unknown Meter');
  });
});
