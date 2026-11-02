import { describe, expect, it } from 'vitest'
import {
  formatTemperatureTick,
  formatTimestamp,
  isStaleMeter,
  pad2,
} from './format'

describe('formatTimestamp', () => {
  const date = new Date(2024, 0, 7, 3, 4, 0)
  const timestamp = date.toISOString()

  it('formats hour scale as hours and minutes', () => {
    expect(formatTimestamp(timestamp, 'hour')).toBe('03:04')
  })

  it('formats day scale as hours and minutes', () => {
    expect(formatTimestamp(timestamp, 'day')).toBe('03:04')
  })

  it('formats week scale as weekday and hour', () => {
    expect(formatTimestamp(timestamp, 'week')).toBe('Sun 03')
  })

  it('formats month scale as month and day', () => {
    expect(formatTimestamp(timestamp, 'month')).toBe('Jan 7')
  })

  it('formats year scale as month and day', () => {
    expect(formatTimestamp(timestamp, 'year')).toBe('Jan 7')
  })

  it('uses the locale default for an unknown scale', () => {
    expect(formatTimestamp(timestamp, 'unknown')).toBe(date.toLocaleString())
  })

  it('pads values below ten', () => {
    expect(pad2(4)).toBe('04')
    expect(pad2(14)).toBe('14')
  })
})

describe('isStaleMeter', () => {
  const threshold = 7 * 24 * 60 * 60 * 1000
  const now = Date.UTC(2024, 0, 8)
  const meter = (last_updated: string | null) => ({ last_updated })

  it('treats missing and invalid timestamps as stale', () => {
    expect(isStaleMeter(meter(null), now, threshold)).toBe(true)
    expect(isStaleMeter(meter('not-a-date'), now, threshold)).toBe(true)
  })

  it('treats a timestamp exactly at the threshold as stale', () => {
    expect(
      isStaleMeter(
        meter(new Date(now - threshold).toISOString()),
        now,
        threshold,
      ),
    ).toBe(true)
  })

  it('keeps a timestamp one millisecond inside the threshold fresh', () => {
    expect(
      isStaleMeter(
        meter(new Date(now - threshold + 1).toISOString()),
        now,
        threshold,
      ),
    ).toBe(false)
  })
})

describe('formatTemperatureTick', () => {
  it('rounds float artifacts and removes unnecessary decimal places', () => {
    expect(formatTemperatureTick(31.400000000000006)).toBe('31.4°')
    expect(formatTemperatureTick(22)).toBe('22°')
    expect(formatTemperatureTick(22.25)).toBe('22.25°')
  })
})
