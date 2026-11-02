import { describe, expect, it } from 'vitest';
import { STALE_METER_THRESHOLD_MS } from '../config';
import type { Meter } from '../types';
import { formatTimestamp, isStaleMeter, pad2 } from './format';

const localDate = new Date(2024, 0, 7, 9, 5, 0);
const timestamp = localDate.toISOString();

const meter = (last_updated: string | null): Meter => ({
  device_id: 'test-device',
  device_name: 'Test Meter',
  device_type: 'Meter',
  current_temperature: 20,
  current_humidity: 50,
  battery: 80,
  last_updated,
});

describe('formatTimestamp', () => {
  it.each([
    ['hour', `${pad2(localDate.getHours())}:${pad2(localDate.getMinutes())}`],
    ['day', `${pad2(localDate.getHours())}:${pad2(localDate.getMinutes())}`],
    ['week', `Sun ${pad2(localDate.getHours())}`],
    ['month', `Jan ${localDate.getDate()}`],
    ['year', `Jan ${localDate.getDate()}`],
  ])('formats %s scale', (scale, expected) => {
    expect(formatTimestamp(timestamp, scale)).toBe(expected);
  });

  it('uses the locale string for an unknown scale', () => {
    expect(formatTimestamp(timestamp, 'unknown')).toBe(localDate.toLocaleString());
  });
});

describe('isStaleMeter', () => {
  it('treats a missing timestamp as stale', () => {
    expect(isStaleMeter(meter(null), Date.now())).toBe(true);
  });

  it('treats an invalid timestamp as stale', () => {
    expect(isStaleMeter(meter('not a date'), Date.now())).toBe(true);
  });

  it('treats exactly the configured threshold as stale', () => {
    const now = Date.now();
    expect(
      isStaleMeter(meter(new Date(now - STALE_METER_THRESHOLD_MS).toISOString()), now),
    ).toBe(true);
  });

  it('treats a timestamp one millisecond inside the threshold as fresh', () => {
    const now = Date.now();
    expect(
      isStaleMeter(
        meter(new Date(now - STALE_METER_THRESHOLD_MS + 1).toISOString()),
        now,
      ),
    ).toBe(false);
  });
});
