import type { Meter, TimeScale } from './types'

export const REFRESH_INTERVAL = 30000
export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export const DISPLAY_NAMES: Record<string, string> = {
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
}

export function getDisplayName(deviceName: string): string {
  return DISPLAY_NAMES[deviceName] ?? deviceName
}

export function isStaleMeter(meter: Meter): boolean {
  if (!meter.last_updated) {
    return true
  }
  const lastUpdated = new Date(meter.last_updated)
  if (Number.isNaN(lastUpdated.getTime())) {
    return true
  }
  return Date.now() - lastUpdated.getTime() >= STALE_METER_THRESHOLD_MS
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  const dayShort = DAY_SHORT[date.getDay()]
  const monthShort = MONTH_SHORT[date.getMonth()]
  const dayNum = date.getDate()

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`
    case 'week':
      return `${dayShort} ${hours}`
    case 'month':
    case 'year':
      return `${monthShort} ${dayNum}`
    default:
      return date.toLocaleString()
  }
}
