import { describe, expect, it } from 'vitest';
import { buildLatencyStatsPath } from './client';

describe('buildLatencyStatsPath', () => {
  it('encodes the 24-hour start time as a query parameter', () => {
    const startTime = '2026-10-12T01:42:00.000+00:00';
    const path = buildLatencyStatsPath(startTime);
    const [pathname, search = ''] = path.split('?');

    expect(pathname).toBe('/api/latency-stats');
    expect(new URLSearchParams(search).get('start_time')).toBe(startTime);
  });
});
