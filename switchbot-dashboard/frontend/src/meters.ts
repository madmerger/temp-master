export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'
export interface Meter {
  device_id: string
  device_name: string
  device_type: string
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}
export interface Status {
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
}
export interface Reading { timestamp: string; temperature: number }

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
  'Study Hub': '制御盤 (CP-1601)',
  'Livingroom Hub': '制御盤 (CP-1602)',
  'Bedroom Hub': '制御盤 (CP-1603)',
  'ガー子ケージ': '配管ライン (PL-1002)',
  '極道': '粉砕機 (G-1701)',
}
export const getDisplayName = (name: string) => Object.hasOwn(DISPLAY_NAMES, name) ? DISPLAY_NAMES[name] : name
export function isStale(meter: Pick<Meter, 'last_updated'>, now = Date.now()) {
  if (!meter.last_updated) return true
  const updated = new Date(meter.last_updated).getTime()
  return Number.isNaN(updated) || now - updated >= 7 * 24 * 60 * 60 * 1000
}
export function formatTimestamp(timestamp: string, scale: TimeScale) {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  if (scale === 'hour' || scale === 'day') return `${hours}:${String(date.getMinutes()).padStart(2, '0')}`
  if (scale === 'week') return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]} ${hours}`
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]} ${date.getDate()}`
}
