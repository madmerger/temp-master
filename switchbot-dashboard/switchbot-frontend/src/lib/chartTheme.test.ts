import { describe, expect, it } from 'vitest';
import { getChartColors } from './chartTheme';

describe('getChartColors', () => {
  it('returns different grid and tick colors for dark and light themes', () => {
    const light = getChartColors(false);
    const dark = getChartColors(true);

    expect(light.grid).not.toBe(dark.grid);
    expect(light.tick).not.toBe(dark.tick);
  });
});
