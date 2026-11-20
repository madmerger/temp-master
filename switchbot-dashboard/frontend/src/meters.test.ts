import { describe, expect, it } from 'vitest'
import { DISPLAY_NAMES, formatTimestamp, getDisplayName, isStale } from './meters'

describe('メーター表示', () => {
  it('7日境界と未受信・不正な日時を判定する', () => {
    const now = Date.parse('2026-11-20T12:00:00Z')
    const threshold = now - 7 * 86400000
    expect(isStale({ last_updated: new Date(threshold).toISOString() }, now)).toBe(true)
    expect(isStale({ last_updated: new Date(threshold + 1).toISOString() }, now)).toBe(false)
    expect(isStale({ last_updated: new Date(threshold - 1).toISOString() }, now)).toBe(true)
    expect(isStale({ last_updated: null }, now)).toBe(true)
    expect(isStale({ last_updated: '' }, now)).toBe(true)
    expect(isStale({ last_updated: 'invalid' }, now)).toBe(true)
    expect(isStale({ last_updated: new Date(now + 1000).toISOString() }, now)).toBe(false)
  })
  it('表示名を移植し、不明な名前は変更しない', () => {
    expect(Object.keys(DISPLAY_NAMES)).toHaveLength(23)
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)')
    expect(getDisplayName('極道')).toBe('粉砕機 (G-1701)')
    expect(getDisplayName('<script>')).toBe('<script>')
    expect(getDisplayName('toString')).toBe('toString')
  })
  it('旧ラベル書式に合わせる', () => {
    const stamp = new Date(2026, 0, 4, 9, 5).toISOString()
    expect(formatTimestamp(stamp, 'hour')).toBe('09:05')
    expect(formatTimestamp(stamp, 'day')).toBe('09:05')
    expect(formatTimestamp(stamp, 'week')).toBe('Sun 09')
    expect(formatTimestamp(stamp, 'month')).toBe('Jan 4')
    expect(formatTimestamp(stamp, 'year')).toBe('Jan 4')
  })
})
