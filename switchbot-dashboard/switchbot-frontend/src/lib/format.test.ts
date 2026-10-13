import { describe, expect, it } from 'vitest'
import { formatClock, formatTimestamp, pad2 } from './format'

const timestamp = new Date(2026, 0, 5, 9, 7).toISOString()

describe('formatTimestamp', () => {
  it.each(['hour', 'day'])('formats %s values as clock time', (scale) => {
    expect(formatTimestamp(timestamp, scale)).toBe('09:07')
  })

  it('formats week labels', () => {
    expect(formatTimestamp(timestamp, 'week')).toBe('Mon 09')
  })

  it.each(['month', 'year'])('formats %s labels', (scale) => {
    expect(formatTimestamp(timestamp, scale)).toBe('Jan 5')
  })

  it('uses the locale default for unknown scales', () => {
    const date = new Date(timestamp)
    expect(formatTimestamp(timestamp, 'unknown')).toBe(date.toLocaleString())
  })
})

describe('formatClock', () => {
  it('formats a time as HH:MM:SS', () => {
    expect(formatClock(new Date(2026, 0, 5, 9, 7, 3))).toBe('09:07:03')
  })
})

describe('pad2', () => {
  it('pads single digit values', () => {
    expect(pad2(5)).toBe('05')
    expect(pad2(12)).toBe('12')
  })
})
