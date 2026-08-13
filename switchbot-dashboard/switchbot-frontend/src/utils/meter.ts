import type { Meter, TimeScale } from '../api/types'

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

export const getDisplayName = (name: string) => DISPLAY_NAMES[name] || name

export function formatTimestamp(timestamp: string, scale: TimeScale): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  if (scale === 'hour' || scale === 'day') {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  }
  if (scale === 'week') {
    const hour = String(date.getHours()).padStart(2, '0')
    return `${date.toLocaleDateString([], { weekday: 'short' })} ${hour}`
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export const isStaleMeter = (meter: Meter, now = Date.now()) => {
  if (!meter.last_updated) {
    return true
  }
  const updated = new Date(meter.last_updated).getTime()
  return Number.isNaN(updated) || now - updated >= STALE_METER_THRESHOLD_MS
}
