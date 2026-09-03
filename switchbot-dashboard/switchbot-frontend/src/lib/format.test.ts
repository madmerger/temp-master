import { describe, expect, it } from 'vitest';
import { formatTimestamp } from './format';

describe('formatTimestamp', () => {
  const timestamp = new Date(2024, 0, 15, 9, 5).toISOString();

  it('formats hour and day as time', () => {
    expect(formatTimestamp(timestamp, 'hour')).toBe('09:05');
    expect(formatTimestamp(timestamp, 'day')).toBe('09:05');
  });

  it('formats week as weekday and hour', () => {
    expect(formatTimestamp(timestamp, 'week')).toBe('Mon 09');
  });

  it('formats month and year as month and day', () => {
    expect(formatTimestamp(timestamp, 'month')).toBe('Jan 15');
    expect(formatTimestamp(timestamp, 'year')).toBe('Jan 15');
  });
});
