import { describe, expect, it } from 'vitest'
import { formatTimestamp } from './formatTimestamp'

describe('formatTimestamp', () => {
  const date = new Date(2024, 0, 15, 9, 5)

  it.each([
    ['hour', '09:05'],
    ['day', '09:05'],
    ['week', 'Mon 09'],
    ['month', 'Jan 15'],
    ['year', 'Jan 15'],
  ])('formats the %s scale', (timeScale, expected) => {
    expect(formatTimestamp(date, timeScale)).toBe(expected)
  })

  it('accepts ISO strings and numeric timestamps', () => {
    expect(formatTimestamp(date.toISOString(), 'hour')).toBe('09:05')
    expect(formatTimestamp(date.getTime(), 'hour')).toBe('09:05')
  })

  it('uses the locale format for an unknown scale', () => {
    expect(formatTimestamp(date, 'unknown')).toBe(date.toLocaleString())
  })
})
