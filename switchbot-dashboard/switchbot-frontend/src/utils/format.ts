import type { TimeScale } from '../types';

const DISPLAY_NAMES: Record<string, string> = {
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
};

export function getDisplayName(deviceName: string): string {
  return DISPLAY_NAMES[deviceName] ?? deviceName;
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`;
    case 'week':
      return `${DAY_SHORT[date.getDay()]} ${hours}`;
    case 'month':
    case 'year':
      return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
    default:
      return date.toLocaleString();
  }
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
