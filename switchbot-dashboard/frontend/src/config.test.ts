import { expect, it, vi } from 'vitest'
import { apiUrl } from './config'

it('API URLは未設定・空なら同一オリジン', () => {
  vi.stubEnv('VITE_API_URL', undefined)
  expect(apiUrl('/api/meters')).toBe('/api/meters')
  vi.stubEnv('VITE_API_URL', '')
  expect(apiUrl('/api/status')).toBe('/api/status')
})
it('指定したAPI URLの末尾スラッシュを除去する', () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.com///')
  expect(apiUrl('/api/meters')).toBe('https://api.example.com/api/meters')
})
