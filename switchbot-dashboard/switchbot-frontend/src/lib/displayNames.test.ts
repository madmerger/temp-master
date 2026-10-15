import { describe, expect, it } from 'vitest';
import { getDisplayName } from './displayNames';

describe('getDisplayName', () => {
  it('returns the mapped industrial name', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)');
  });

  it('passes through names without a mapping', () => {
    expect(getDisplayName('Unmapped Meter')).toBe('Unmapped Meter');
  });
});
