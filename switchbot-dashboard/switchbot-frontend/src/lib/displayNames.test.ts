import { describe, expect, it } from 'vitest'
import { getDisplayName } from './displayNames'

describe('getDisplayName', () => {
  it('returns a mapped device name', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)')
  })

  it('returns an unmapped device name unchanged', () => {
    expect(getDisplayName('Unknown Meter')).toBe('Unknown Meter')
  })
})
