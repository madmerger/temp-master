import { apiUrl } from './config'

async function requestUrl(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  if (!response.ok) {
    if (response.status === 401) throw new Error('管理トークンが無効です')
    if (response.status === 503) throw new Error('管理APIが未設定です。管理者にお問い合わせください')
    throw new Error(`リクエストに失敗しました (HTTP ${response.status})`)
  }
  return response
}
export async function request(path: string, init?: RequestInit) {
  return requestUrl(apiUrl(path), init)
}
export async function getJson<T>(path: string): Promise<T> {
  return (await request(path)).json()
}
export async function downloadBackup(token: string) {
  const response = await requestUrl('/api/backup', { headers: { Authorization: `Bearer ${token}` } })
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plain = disposition.match(/filename="([^"]+)"|filename=([^;]+)/i)
  let filename = plain?.[1] ?? plain?.[2]?.trim() ?? 'switchbot_backup.db'
  if (encoded) {
    try { filename = decodeURIComponent(encoded) } catch { /* 通常のファイル名へフォールバック */ }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
  } finally {
    link.remove()
    URL.revokeObjectURL(url)
  }
}
