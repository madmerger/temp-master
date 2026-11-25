export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'

export interface Meter {
  device_id: string
  device_name: string
  device_type: string
  hub_device_id?: string | null
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}

export interface HistoryEntry {
  timestamp: string
  temperature: number
  humidity: number
  battery: number | null
}

export interface Status {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
  last_api_call: number
  collection_interval: number
}

export const DISPLAY_NAMES: Readonly<Record<string, string>> = {
  'Bedroom Meter': '第1蒸留塔 (T-101)',
  'Living Meter': '第2蒸留塔 (T-102)',
  '2世': '反応器 (R-201)',
  '夢男': '熱交換器 (E-301)',
  '夢': '熱交換器 (E-302)',
  'アワコ': '冷却塔 (CT-401)',
  'ジャガ百万石': '加熱炉 (H-501)',
  'ネズミ': 'コンプレッサー (C-601)',
  'バロン': '遠心分離機 (S-701)',
  'ゴンタ': '混合槽 (M-801)',
  '蛇棚': '貯蔵タンク (TK-901)',
  '中華棚': '貯蔵タンク (TK-902)',
  'へておケージ': '配管ライン (PL-1001)',
  '外': '屋外モニター (EM-1101)',
  'インキュベーター': '乾燥機 (D-1201)',
  'ビアク': '吸収塔 (A-1301)',
  'ブロッチ Hot Spot': 'フレアスタック (FS-1401)',
  'マダラアオジタ': 'ボイラー (B-1501)',
  'Study Hub': '制御盤 (CP-1601)',
  'Livingroom Hub': '制御盤 (CP-1602)',
  'Bedroom Hub': '制御盤 (CP-1603)',
  'ガー子ケージ': '配管ライン (PL-1002)',
  '極道': '粉砕機 (G-1701)',
}

export function getDisplayName(deviceName: string): string {
  return Object.hasOwn(DISPLAY_NAMES, deviceName) ? DISPLAY_NAMES[deviceName] : deviceName
}

const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export function isStaleMeter(meter: Pick<Meter, 'last_updated'>, now = Date.now()): boolean {
  const timestamp = meter.last_updated ? Date.parse(meter.last_updated) : NaN
  return Number.isNaN(timestamp) || now - timestamp >= STALE_METER_THRESHOLD_MS
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatTimestamp(timestamp: string, timeScale?: TimeScale): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`
    case 'week':
      return `${DAYS[date.getDay()]} ${pad(date.getHours())}`
    case 'month':
    case 'year':
      return `${MONTHS[date.getMonth()]} ${date.getDate()}`
    default:
      return date.toLocaleString()
  }
}
