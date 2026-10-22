import { describe, expect, it } from 'vitest';
import { DISPLAY_NAMES, getDisplayName } from './displayNames';

describe('getDisplayName', () => {
  it('旧 index.html と同じ 23 件のエイリアスを持つ', () => {
    expect(Object.keys(DISPLAY_NAMES)).toHaveLength(23);
  });

  it('マップに存在する名前は表示名に変換する', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)');
    expect(getDisplayName('夢男')).toBe('熱交換器 (E-301)');
    expect(getDisplayName('極道')).toBe('粉砕機 (G-1701)');
  });

  it('マップに無い名前はそのまま返す', () => {
    expect(getDisplayName('Unknown Device')).toBe('Unknown Device');
    expect(getDisplayName('toString')).toBe('toString');
  });
});
