import { describe, expect, it } from 'vitest';
import { getDisplayName } from './displayNames';
import { isStaleMeter, pad2, formatTimestamp } from './utils';
import type { Meter } from './types';

const day = 24 * 60 * 60 * 1000;

function meter(lastUpdated: string | null): Meter {
  return {
    device_id: 'meter-1',
    device_name: 'Bedroom Meter',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: 23.5,
    current_humidity: 45,
    battery: 90,
    last_updated: lastUpdated,
  };
}

describe('meter and display utilities', () => {
  it('marks missing and invalid timestamps stale, but keeps recent readings active', () => {
    const now = Date.now();

    expect(isStaleMeter(meter(null), now)).toBe(true);
    expect(isStaleMeter(meter('not-a-timestamp'), now)).toBe(true);
    expect(isStaleMeter(meter(new Date(now - 6 * day).toISOString()), now)).toBe(false);
    expect(isStaleMeter(meter(new Date(now - 7 * day).toISOString()), now)).toBe(true);
  });

  it('pads numbers and formats timestamps for every range', () => {
    const timestamp = '2024-01-01T13:05:00';

    expect(pad2(5)).toBe('05');
    expect(pad2(13)).toBe('13');
    expect(formatTimestamp(timestamp, 'hour')).toBe('13:05');
    expect(formatTimestamp(timestamp, 'day')).toBe('13:05');
    expect(formatTimestamp(timestamp, 'week')).toBe('Mon 13');
    expect(formatTimestamp(timestamp, 'month')).toBe('Jan 1');
    expect(formatTimestamp(timestamp, 'year')).toBe('Jan 1');
    expect(formatTimestamp(timestamp, 'unknown')).toBe(
      new Date(timestamp).toLocaleString(),
    );
  });

  it('maps known device names and preserves unknown names', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)');
    expect(getDisplayName('Some New Meter')).toBe('Some New Meter');
  });
});
