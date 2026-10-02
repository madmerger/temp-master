import { describe, expect, it } from 'vitest'
import { getDisplayName } from './displayNames'

describe('getDisplayName', () => {
  it('maps known device names', () => {
    expect(getDisplayName('夢男')).toBe('熱交換器 (E-301)')
  })

  it('returns unknown names unchanged', () => {
    expect(getDisplayName('Unknown Meter')).toBe('Unknown Meter')
  })
})
