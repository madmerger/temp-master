import { describe, expect, it } from 'vitest';
import { DISPLAY_NAMES, TIME_SCALE_OPTIONS, getDisplayName } from './api';

describe('getDisplayName', () => {
  it('returns mapped name when present', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)');
    expect(getDisplayName('Living Meter')).toBe('第2蒸留塔 (T-102)');
    expect(getDisplayName('外')).toBe('屋外モニター (EM-1101)');
  });

  it('returns original name when no mapping exists', () => {
    expect(getDisplayName('Unknown Device')).toBe('Unknown Device');
    expect(getDisplayName('')).toBe('');
  });
});

describe('DISPLAY_NAMES', () => {
  it('contains expected number of mappings', () => {
    expect(Object.keys(DISPLAY_NAMES).length).toBeGreaterThan(0);
  });
});

describe('TIME_SCALE_OPTIONS', () => {
  it('has 5 options', () => {
    expect(TIME_SCALE_OPTIONS).toHaveLength(5);
  });

  it('includes hour, day, week, month, year', () => {
    const values = TIME_SCALE_OPTIONS.map((o) => o.value);
    expect(values).toEqual(['hour', 'day', 'week', 'month', 'year']);
  });

  it('each option has a label', () => {
    TIME_SCALE_OPTIONS.forEach((opt) => {
      expect(opt.label).toBeTruthy();
    });
  });
});
