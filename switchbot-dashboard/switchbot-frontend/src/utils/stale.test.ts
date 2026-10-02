import { describe, expect, it } from 'vitest'
import { STALE_METER_THRESHOLD_MS } from '../config'
import { isStaleMeter } from './stale'

describe('isStaleMeter', () => {
  const now = new Date('2026-10-02T12:00:00Z').getTime()

  it('treats null and invalid timestamps as stale', () => {
    expect(isStaleMeter({ last_updated: null }, now)).toBe(true)
    expect(isStaleMeter({ last_updated: 'not a date' }, now)).toBe(true)
  })

  it.each([
    [6, false],
    [7, true],
    [8, true],
  ])('treats %i days ago as stale=%s', (days, expected) => {
    const timestamp = new Date(now - days * 24 * 60 * 60 * 1000).toISOString()
    expect(isStaleMeter({ last_updated: timestamp }, now)).toBe(expected)
  })

  it('uses the seven-day threshold', () => {
    expect(STALE_METER_THRESHOLD_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })
})
