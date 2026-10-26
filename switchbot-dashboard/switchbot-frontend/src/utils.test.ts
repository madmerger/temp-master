import { describe, expect, it } from 'vitest'
import { getDisplayName } from './displayNames'
import { extractFilename, formatTimestamp, isStaleMeter } from './utils'
import type { Meter } from './types'

const timestamp = '2024-03-06T14:05:00'

describe('formatTimestamp', () => {
  it.each([
    ['hour', '14:05'],
    ['day', '14:05'],
    ['week', 'Wed 14'],
    ['month', 'Mar 6'],
    ['year', 'Mar 6'],
  ] as const)('formats %s scale', (scale, expected) => {
    expect(formatTimestamp(timestamp, scale)).toBe(expected)
  })

  it('uses the locale string for an unspecified scale', () => {
    expect(formatTimestamp(timestamp)).toBe(new Date(timestamp).toLocaleString())
  })
})

describe('isStaleMeter', () => {
  const now = Date.parse('2024-03-08T12:00:00Z')
  const createMeter = (last_updated: string | null): Meter => ({
    device_id: 'meter-1',
    device_name: 'Meter',
    device_type: 'Meter',
    current_temperature: null,
    current_humidity: null,
    battery: null,
    last_updated,
  })

  it('marks a missing meter timestamp as stale', () => {
    expect(isStaleMeter(null, now)).toBe(true)
    expect(isStaleMeter(createMeter(null), now)).toBe(true)
  })

  it('marks an invalid timestamp as stale', () => {
    expect(isStaleMeter(createMeter('not a date'), now)).toBe(true)
  })

  it('marks a meter just under seven days as current', () => {
    expect(isStaleMeter(createMeter(new Date(now - 7 * 24 * 60 * 60 * 1000 + 1).toISOString()), now)).toBe(false)
  })

  it('marks a meter at seven days as stale', () => {
    expect(isStaleMeter(createMeter(new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()), now)).toBe(true)
  })
})

describe('getDisplayName', () => {
  it('returns the mapped display name', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)')
  })

  it('passes through names without a mapping', () => {
    expect(getDisplayName('Unknown Meter')).toBe('Unknown Meter')
  })
})

describe('extractFilename', () => {
  it('extracts a quoted filename', () => {
    expect(extractFilename('attachment; filename="backup.db"')).toBe('backup.db')
  })

  it('extracts an unquoted filename', () => {
    expect(extractFilename('attachment; filename=backup.db')).toBe('backup.db')
  })

  it('uses the backup filename when it is missing', () => {
    expect(extractFilename('attachment')).toBe('switchbot_backup.db')
  })
})
