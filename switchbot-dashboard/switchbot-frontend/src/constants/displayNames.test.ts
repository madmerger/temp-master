import { describe, expect, it } from 'vitest'
import displayNames from '../../../display_names.json'
import { DISPLAY_NAMES, getDisplayName } from './displayNames'

describe('getDisplayName', () => {
  it('maps legacy device names to their industrial names', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)')
    expect(getDisplayName('Livingroom Hub')).toBe('制御盤 (CP-1602)')
  })

  it('returns an unmapped device name unchanged', () => {
    expect(getDisplayName('Unmapped Meter')).toBe('Unmapped Meter')
  })

  it('keeps all 23 display names present in the legacy page', () => {
    expect(Object.keys(displayNames)).toHaveLength(23)
    expect(DISPLAY_NAMES).toEqual(displayNames)
  })
})
