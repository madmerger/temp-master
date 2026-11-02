import { describe, expect, it } from 'vitest';
import { DISPLAY_NAMES, getDisplayName } from './displayNames';

describe('display names', () => {
  it('maps known names and passes unknown names through', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)');
    expect(getDisplayName('Unmapped Meter')).toBe('Unmapped Meter');
  });

  it('contains every display name in the legacy page', () => {
    expect(Object.keys(DISPLAY_NAMES)).toHaveLength(23);
  });
});
