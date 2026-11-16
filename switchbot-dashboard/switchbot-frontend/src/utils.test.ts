import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatTimestamp, isStaleMeter, STALE_METER_THRESHOLD_MS } from './utils';
afterEach(() => vi.useRealTimers());
describe('isStaleMeter', () => {
  it('handles missing and invalid dates', () => {
    for (const last_updated of [undefined, null, '', 'invalid'])
      expect(isStaleMeter({ last_updated })).toBe(true);
  });
  it('uses the exact seven day boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T12:00:00Z'));
    expect(
      isStaleMeter({ last_updated: new Date(Date.now() - STALE_METER_THRESHOLD_MS).toISOString() }),
    ).toBe(true);
    expect(
      isStaleMeter({
        last_updated: new Date(Date.now() - STALE_METER_THRESHOLD_MS + 1).toISOString(),
      }),
    ).toBe(false);
    expect(isStaleMeter({ last_updated: new Date(Date.now() + 1000).toISOString() })).toBe(false);
  });
});
describe('formatTimestamp', () => {
  it('formats each range using local time', () => {
    const date = new Date(2026, 0, 5, 9, 7);
    const input = date.toISOString();
    for (const scale of ['hour', 'day']) expect(formatTimestamp(input, scale)).toBe('09:07');
    expect(formatTimestamp(input, 'week')).toBe('Mon 09');
    for (const scale of ['month', 'year']) expect(formatTimestamp(input, scale)).toBe('Jan 5');
    expect(formatTimestamp(input, 'other')).toBe(date.toLocaleString());
  });
  it('preserves invalid and empty date behavior', () => {
    expect(formatTimestamp('', 'day')).toBe('NaN:NaN');
    expect(formatTimestamp('invalid', 'other')).toBe('Invalid Date');
  });
});
