import { describe, expect, it } from 'vitest';
import type { Meter } from '../types';
import { STALE_METER_THRESHOLD_MS } from './constants';
import { isStaleMeter, partitionMeters } from './meters';

const NOW = Date.parse('2026-10-22T00:00:00Z');

function meter(lastUpdated: string | null | undefined, id = 'X'): Meter {
  return { device_id: id, device_name: id, device_type: 'Meter', last_updated: lastUpdated };
}

describe('isStaleMeter', () => {
  it('last_updated が無い場合は未更新とみなす', () => {
    expect(isStaleMeter(meter(null), NOW)).toBe(true);
    expect(isStaleMeter(meter(undefined), NOW)).toBe(true);
    expect(isStaleMeter(meter(''), NOW)).toBe(true);
  });

  it('日時として解釈できない場合は未更新とみなす', () => {
    expect(isStaleMeter(meter('not-a-date'), NOW)).toBe(true);
  });

  it('ちょうど7日前は未更新、7日未満は更新中とみなす', () => {
    expect(isStaleMeter(meter(new Date(NOW - STALE_METER_THRESHOLD_MS).toISOString()), NOW)).toBe(
      true,
    );
    expect(
      isStaleMeter(meter(new Date(NOW - STALE_METER_THRESHOLD_MS + 1).toISOString()), NOW),
    ).toBe(false);
    expect(isStaleMeter(meter(new Date(NOW).toISOString()), NOW)).toBe(false);
  });
});

describe('partitionMeters', () => {
  it('元の並び順を保ったまま更新中・未更新に振り分ける', () => {
    const meters = [
      meter(new Date(NOW).toISOString(), 'A'),
      meter(null, 'B'),
      meter(new Date(NOW - 1000).toISOString(), 'C'),
      meter('2020-01-01T00:00:00Z', 'D'),
    ];
    const { activeMeters, staleMeters } = partitionMeters(meters, NOW);
    expect(activeMeters.map((m) => m.device_id)).toEqual(['A', 'C']);
    expect(staleMeters.map((m) => m.device_id)).toEqual(['B', 'D']);
  });
});
