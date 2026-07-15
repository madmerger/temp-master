import type { TimeScale } from "./types/api";

export const REFRESH_INTERVAL = 30_000;
export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export const DISPLAY_NAMES: Readonly<Record<string, string>> = {
  "Bedroom Meter": "第1蒸留塔 (T-101)",
  "Living Meter": "第2蒸留塔 (T-102)",
  "2世": "反応器 (R-201)",
  夢男: "熱交換器 (E-301)",
  夢: "熱交換器 (E-302)",
  アワコ: "冷却塔 (CT-401)",
  ジャガ百万石: "加熱炉 (H-501)",
  ネズミ: "コンプレッサー (C-601)",
  バロン: "遠心分離機 (S-701)",
  ゴンタ: "混合槽 (M-801)",
  蛇棚: "貯蔵タンク (TK-901)",
  中華棚: "貯蔵タンク (TK-902)",
  へておケージ: "配管ライン (PL-1001)",
  外: "屋外モニター (EM-1101)",
  インキュベーター: "乾燥機 (D-1201)",
  ビアク: "吸収塔 (A-1301)",
  "ブロッチ Hot Spot": "フレアスタック (FS-1401)",
  マダラアオジタ: "ボイラー (B-1501)",
};

export const TIME_SCALE_OPTIONS: ReadonlyArray<{
  value: TimeScale;
  label: string;
}> = [
  { value: "hour", label: "直近1時間" },
  { value: "day", label: "直近24時間" },
  { value: "week", label: "直近7日間" },
  { value: "month", label: "直近30日間" },
  { value: "year", label: "直近1年間" },
];
