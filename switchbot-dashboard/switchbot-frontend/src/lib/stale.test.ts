import { describe, expect, it } from 'vitest';
import { STALE_METER_THRESHOLD_MS } from '../config';
import { isStaleMeter } from './stale';
import type { Meter } from '../types';

const meter = (last_updated?: string | null): Meter => ({
  device_id: 'device',
  device_name: 'Meter',
  device_type: 'Meter',
  last_updated,
});

describe('isStaleMeter', () => {
  const now = Date.parse('2024-01-15T12:00:00.000Z');

  it('marks missing and invalid timestamps stale', () => {
    expect(isStaleMeter(meter(), now)).toBe(true);
    expect(isStaleMeter(meter('not-a-date'), now)).toBe(true);
  });

  it('marks threshold-age meters stale', () => {
    expect(isStaleMeter(meter(new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString()), now)).toBe(true);
    expect(isStaleMeter(meter(new Date(now - STALE_METER_THRESHOLD_MS).toISOString()), now)).toBe(true);
  });

  it('keeps recent meters active', () => {
    expect(isStaleMeter(meter(new Date(now - 60 * 60 * 1000).toISOString()), now)).toBe(false);
  });
});
