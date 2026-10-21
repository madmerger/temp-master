import { describe, expect, it } from 'vitest'
import { buildApiUrl } from './config'

describe('buildApiUrl', () => {
  it('uses a same-origin path when the base is empty', () => {
    expect(buildApiUrl('/api/meters', '')).toBe('/api/meters')
  })

  it('removes a trailing slash from the base', () => {
    expect(buildApiUrl('/api/meters', 'https://example.com/')).toBe(
      'https://example.com/api/meters',
    )
  })

  it('adds a leading slash when the path does not have one', () => {
    expect(buildApiUrl('api/meters', '')).toBe('/api/meters')
  })
})
