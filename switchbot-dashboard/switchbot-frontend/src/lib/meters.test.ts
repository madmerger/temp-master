import { describe, expect, it } from 'vitest'
import { isStaleMeter, partitionMeters, STALE_METER_THRESHOLD_MS } from './meters'
import type { Meter } from '../types'

function meter(device_id: string, last_updated: string | null): Meter {
  return {
    device_id,
    device_name: device_id,
    device_type: 'Meter',
    current_temperature: null,
    current_humidity: null,
    battery: null,
    last_updated,
  }
}

describe('isStaleMeter', () => {
  it('treats missing timestamps as stale', () => {
    expect(isStaleMeter(meter('missing', null))).toBe(true)
  })

  it('treats invalid timestamps as stale', () => {
    expect(isStaleMeter(meter('invalid', 'not-a-date'))).toBe(true)
  })

  it('treats a timestamp exactly seven days old as stale', () => {
    const now = Date.parse('2026-01-08T12:00:00Z')
    expect(isStaleMeter(meter('threshold', new Date(now - STALE_METER_THRESHOLD_MS).toISOString()), now)).toBe(true)
  })

  it('keeps a timestamp one millisecond newer than seven days active', () => {
    const now = Date.parse('2026-01-08T12:00:00Z')
    expect(isStaleMeter(meter('active', new Date(now - STALE_METER_THRESHOLD_MS + 1).toISOString()), now)).toBe(false)
  })
})

describe('partitionMeters', () => {
  it('preserves relative order in each partition', () => {
    const now = Date.parse('2026-01-08T12:00:00Z')
    const meters = [
      meter('active-1', new Date(now - 1000).toISOString()),
      meter('stale-1', null),
      meter('active-2', new Date(now - 2000).toISOString()),
      meter('stale-2', 'invalid'),
    ]

    const result = partitionMeters(meters, now)
    expect(result.active.map((item) => item.device_id)).toEqual(['active-1', 'active-2'])
    expect(result.stale.map((item) => item.device_id)).toEqual(['stale-1', 'stale-2'])
  })
})
