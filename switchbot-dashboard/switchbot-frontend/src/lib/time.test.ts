import { describe, expect, it } from 'vitest';
import { formatTimestamp, isStaleMeter, STALE_METER_THRESHOLD_MS } from './time';

const sampleDate = new Date(2024, 0, 7, 9, 5, 0);
const sampleTimestamp = sampleDate.toISOString();

describe('formatTimestamp', () => {
  it('formats hourly values as local hours and minutes', () => {
    expect(formatTimestamp(sampleTimestamp, 'hour')).toBe('09:05');
  });

  it('formats daily values as local hours and minutes', () => {
    expect(formatTimestamp(sampleTimestamp, 'day')).toBe('09:05');
  });

  it('formats weekly values with a short weekday and hour', () => {
    expect(formatTimestamp(sampleTimestamp, 'week')).toBe('Sun 09');
  });

  it('formats monthly values with a short month and day number', () => {
    expect(formatTimestamp(sampleTimestamp, 'month')).toBe('Jan 7');
  });

  it('formats yearly values with a short month and day number', () => {
    expect(formatTimestamp(sampleTimestamp, 'year')).toBe('Jan 7');
  });
});

describe('isStaleMeter', () => {
  const now = Date.parse('2024-01-10T12:00:00.000Z');

  it('treats null and invalid timestamps as stale', () => {
    expect(isStaleMeter({ last_updated: null }, now)).toBe(true);
    expect(isStaleMeter({ last_updated: 'not-a-date' }, now)).toBe(true);
  });

  it('treats an update from six days ago as current', () => {
    expect(isStaleMeter({ last_updated: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString() }, now)).toBe(false);
  });

  it('treats an update exactly seven days ago as stale', () => {
    expect(isStaleMeter({ last_updated: new Date(now - STALE_METER_THRESHOLD_MS).toISOString() }, now)).toBe(true);
  });

  it('treats an update from eight days ago as stale', () => {
    expect(isStaleMeter({ last_updated: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString() }, now)).toBe(true);
  });
});
