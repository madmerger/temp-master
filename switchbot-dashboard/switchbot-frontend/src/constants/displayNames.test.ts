import { describe, expect, it } from 'vitest'
import { DISPLAY_NAMES, getDisplayName } from './displayNames'

describe('getDisplayName', () => {
  it('maps legacy device names to their industrial names', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)')
    expect(getDisplayName('極道')).toBe('粉砕機 (G-1701)')
  })

  it('returns an unmapped device name unchanged', () => {
    expect(getDisplayName('Unmapped Meter')).toBe('Unmapped Meter')
  })

  it('keeps all 23 display names present in the legacy page', () => {
    expect(Object.keys(DISPLAY_NAMES)).toHaveLength(23)
  })
})
