import { describe, expect, it } from 'vitest';
import { getDisplayName } from './displayNames';

describe('getDisplayName', () => {
  it('maps known device names', () => {
    expect(getDisplayName('夢男')).toBe('熱交換器 (E-301)');
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)');
  });

  it('passes unknown names through', () => {
    expect(getDisplayName('Unknown Meter')).toBe('Unknown Meter');
  });
});
