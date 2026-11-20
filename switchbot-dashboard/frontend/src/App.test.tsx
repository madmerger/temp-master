import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import App, { Controls, MeterCard, StaleMetersSection, StatusBar } from './App'
import type { Meter } from './meters'

const meter: Meter = { device_id: 'one', device_name: 'Bedroom Meter', device_type: 'Meter', current_temperature: null, current_humidity: null, battery: null, last_updated: null }
function setup(element = <Controls scale="day" setScale={() => {}} />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}>{element}</QueryClientProvider>)
  return client
}
const response = (status = 200) => new Response('{}', { status })

it('未受信カードはnullバッジ・チャートを非表示にする', () => {
  setup(<MeterCard meter={meter} scale="day" />)
  expect(screen.getByText('第1蒸留塔 (T-101)')).toBeInTheDocument()
  expect(screen.getByText('Meter')).toBeInTheDocument()
  expect(screen.getByText('7日以上未更新')).toBeInTheDocument()
  expect(screen.getByText('履歴データの取得対象外')).toBeInTheDocument()
  expect(screen.getByText('値がありません（データ未受信）')).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.queryByText(/°C|%/)).not.toBeInTheDocument()
})
it('staleカードの最終更新・ゼロ値とセクション文言を表示する', () => {
  const last_updated = '2020-01-01T00:00:00Z'
  setup(<StaleMetersSection meters={[{ ...meter, last_updated, current_temperature: 0, current_humidity: 0, battery: 0 }]} scale="day" />)
  expect(screen.getByRole('heading', { name: '未更新のメーター' })).toBeInTheDocument()
  expect(screen.getByText('1週間以上更新されていないデバイス')).toBeInTheDocument()
  expect(screen.getByText(`Last updated: ${new Date(last_updated).toLocaleString()}`)).toBeInTheDocument()
  expect(screen.getByText('0°C')).toBeInTheDocument()
  expect(screen.getAllByText('0%')).toHaveLength(2)
})
it('staleが空ならセクションを作らない', () => {
  setup(<StaleMetersSection meters={[]} scale="day" />)
  expect(screen.queryByText('未更新のメーター')).not.toBeInTheDocument()
})
it('Refresh成功でBearerを送り再取得する', async () => {
  const fetch = vi.fn().mockResolvedValue(response())
  vi.stubGlobal('fetch', fetch)
  const client = setup()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  await userEvent.type(screen.getByLabelText('管理トークン'), 'test')
  await userEvent.click(screen.getByRole('button', { name: 'Refresh Data' }))
  await waitFor(() => expect(invalidate).toHaveBeenCalled())
  expect(fetch).toHaveBeenCalledWith('/api/meters/refresh', { method: 'POST', headers: { Authorization: 'Bearer test' } })
  expect(sessionStorage.getItem('admin-api-token')).toBeNull()
  expect(localStorage.getItem('admin-api-token')).toBeNull()
})
it('外部API指定時もRefreshはAPIベースを使用する', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.com/')
  const fetch = vi.fn().mockResolvedValue(response())
  vi.stubGlobal('fetch', fetch)
  setup()
  await userEvent.type(screen.getByLabelText('管理トークン'), 'test')
  await userEvent.click(screen.getByRole('button', { name: 'Refresh Data' }))
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('https://api.example.com/api/meters/refresh', { method: 'POST', headers: { Authorization: 'Bearer test' } }))
})
it('Refresh失敗は制御したpromiseのsettle後も再取得で消さない', async () => {
  let reject!: (reason: Error) => void
  const pending = new Promise<Response>((_, fail) => { reject = fail })
  vi.stubGlobal('fetch', vi.fn().mockImplementation((path: string) => path.endsWith('/refresh') ? pending : Promise.resolve(new Response(JSON.stringify(path === '/api/status' ? { meters_count: 0 } : { meters: [] })))))
  const client = setup(<App />)
  await userEvent.click(screen.getByRole('button', { name: 'Refresh Data' }))
  expect(screen.getByRole('button', { name: 'Refreshing...' })).toBeDisabled()
  await act(async () => {
    reject(new Error('更新テスト失敗'))
    await pending.catch(() => {})
  })
  expect(await screen.findByText('更新に失敗しました: 更新テスト失敗')).toBeInTheDocument()
  await act(async () => { await client.invalidateQueries() })
  expect(screen.getByText('更新に失敗しました: 更新テスト失敗')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Refresh Data' })).toBeEnabled()
})
it.each(['', 'https://api.example.com/'])('APIベース%sでもBackupは同一オリジンでBlobとファイル名を利用しBearerを送る', async base => {
  vi.stubEnv('VITE_API_URL', base)
  const blob = new Blob(['SQLite snapshot'])
  const fetch = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob, headers: new Headers({ 'Content-Disposition': 'attachment; filename="snapshot.db"' }) })
  vi.stubGlobal('fetch', fetch)
  const create = vi.fn().mockReturnValue('blob:backup')
  const revoke = vi.fn()
  vi.stubGlobal('URL', class extends URL { static createObjectURL = create; static revokeObjectURL = revoke })
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('snapshot.db')
    expect(this.href).toBe('blob:backup')
  })
  setup()
  await userEvent.type(screen.getByLabelText('管理トークン'), 'test')
  await userEvent.click(screen.getByRole('button', { name: 'Download Backup' }))
  await waitFor(() => expect(click).toHaveBeenCalledOnce())
  expect(create).toHaveBeenCalledWith(blob)
  expect(revoke).toHaveBeenCalledWith('blob:backup')
  expect(fetch).toHaveBeenCalledWith('/api/backup', { headers: { Authorization: 'Bearer test' } })
})
it.each([401, 503])('Backup失敗 %s の説明を表示する', async status => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.com')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(status)))
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Download Backup' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(status === 401 ? '管理トークンが無効です' : '管理APIが未設定です')
})
it('再マウント時は保存済みトークンを読み込まず入力値を破棄する', async () => {
  sessionStorage.setItem('admin-api-token', 'legacy-token')
  const client = new QueryClient()
  const view = render(<QueryClientProvider client={client}><Controls scale="day" setScale={() => {}} /></QueryClientProvider>)
  expect(screen.getByLabelText('管理トークン')).toHaveValue('')
  await userEvent.type(screen.getByLabelText('管理トークン'), 'test')
  view.unmount()
  setup()
  expect(screen.getByLabelText('管理トークン')).toHaveValue('')
  expect(sessionStorage.getItem('admin-api-token')).toBe('legacy-token')
})
it('接続状態と旧レートリミット文言を表示する', () => {
  setup(<StatusBar connected status={{ meters_count: 3, is_rate_limited: true, backoff_remaining: 42 }} updated={0} />)
  expect(screen.getByText('Connected')).toBeInTheDocument()
  expect(screen.getByText('Monitoring 3 meters')).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('SwitchBot API rate limit reached. Retry in 42 seconds.')
})
