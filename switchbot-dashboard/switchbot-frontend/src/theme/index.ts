import type { ThemeMode } from "../types";

export interface ThemeTokens {
  label: string;
  bgBody: string;
  bgCard: string;
  bgCardHeader: string;
  bgNav: string;
  bgInput: string;
  bgControlPanel: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
  chartLine: string;
  chartFill: string;
  chartGrid: string;
  chartTick: string;
  chartHover: string;
  badgeTemp: string;
  badgeTempText: string;
  badgeHumidity: string;
  badgeHumidityText: string;
  badgeBattery: string;
  badgeBatteryText: string;
  btnPrimary: string;
  btnPrimaryText: string;
  btnSecondary: string;
  btnSecondaryText: string;
  alertInfo: string;
  alertInfoText: string;
  alertWarning: string;
  alertWarningText: string;
  alertDanger: string;
  alertDangerText: string;
  statusConnected: string;
  statusDisconnected: string;
  deviceTypeTag: string;
  deviceTypeTagText: string;
  shadow: string;
}

const light: ThemeTokens = {
  label: "Light",
  bgBody: "#f5f5f5",
  bgCard: "#ffffff",
  bgCardHeader: "#f8f8f8",
  bgNav: "#ffffff",
  bgInput: "#ffffff",
  bgControlPanel: "#ffffff",
  textPrimary: "#333333",
  textSecondary: "#555555",
  textMuted: "#777777",
  borderColor: "#dddddd",
  chartLine: "#d9534f",
  chartFill: "rgba(217, 83, 79, 0.15)",
  chartGrid: "rgba(0, 0, 0, 0.05)",
  chartTick: "#777777",
  chartHover: "#5bc0de",
  badgeTemp: "#d9534f",
  badgeTempText: "#ffffff",
  badgeHumidity: "#5bc0de",
  badgeHumidityText: "#ffffff",
  badgeBattery: "#5cb85c",
  badgeBatteryText: "#ffffff",
  btnPrimary: "#337ab7",
  btnPrimaryText: "#ffffff",
  btnSecondary: "#ffffff",
  btnSecondaryText: "#333333",
  alertInfo: "#d9edf7",
  alertInfoText: "#31708f",
  alertWarning: "#fcf8e3",
  alertWarningText: "#8a6d3b",
  alertDanger: "#f2dede",
  alertDangerText: "#a94442",
  statusConnected: "#5cb85c",
  statusDisconnected: "#d9534f",
  deviceTypeTag: "#eeeeee",
  deviceTypeTagText: "#777777",
  shadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const dark: ThemeTokens = {
  label: "Dark",
  bgBody: "#121212",
  bgCard: "#1e1e1e",
  bgCardHeader: "#252525",
  bgNav: "#1a1a1a",
  bgInput: "#2a2a2a",
  bgControlPanel: "#1e1e1e",
  textPrimary: "#e0e0e0",
  textSecondary: "#b0b0b0",
  textMuted: "#888888",
  borderColor: "#333333",
  chartLine: "#ef5350",
  chartFill: "rgba(239, 83, 80, 0.20)",
  chartGrid: "rgba(255, 255, 255, 0.06)",
  chartTick: "#888888",
  chartHover: "#4dd0e1",
  badgeTemp: "#ef5350",
  badgeTempText: "#ffffff",
  badgeHumidity: "#4dd0e1",
  badgeHumidityText: "#121212",
  badgeBattery: "#66bb6a",
  badgeBatteryText: "#121212",
  btnPrimary: "#42a5f5",
  btnPrimaryText: "#121212",
  btnSecondary: "#2a2a2a",
  btnSecondaryText: "#e0e0e0",
  alertInfo: "#1a2a3a",
  alertInfoText: "#81d4fa",
  alertWarning: "#332b00",
  alertWarningText: "#ffcc02",
  alertDanger: "#3b1a1a",
  alertDangerText: "#ef9a9a",
  statusConnected: "#66bb6a",
  statusDisconnected: "#ef5350",
  deviceTypeTag: "#333333",
  deviceTypeTagText: "#aaaaaa",
  shadow: "0 1px 4px rgba(0,0,0,0.3)",
};

const industrial: ThemeTokens = {
  label: "Industrial",
  bgBody: "#1b1b1b",
  bgCard: "#242424",
  bgCardHeader: "#2c2c2c",
  bgNav: "#0d0d0d",
  bgInput: "#333333",
  bgControlPanel: "#242424",
  textPrimary: "#ff9800",
  textSecondary: "#ffb74d",
  textMuted: "#a0a0a0",
  borderColor: "#444444",
  chartLine: "#ff9800",
  chartFill: "rgba(255, 152, 0, 0.15)",
  chartGrid: "rgba(255, 152, 0, 0.08)",
  chartTick: "#a0a0a0",
  chartHover: "#ffc107",
  badgeTemp: "#ff5722",
  badgeTempText: "#ffffff",
  badgeHumidity: "#00bcd4",
  badgeHumidityText: "#000000",
  badgeBattery: "#8bc34a",
  badgeBatteryText: "#000000",
  btnPrimary: "#ff9800",
  btnPrimaryText: "#000000",
  btnSecondary: "#333333",
  btnSecondaryText: "#ff9800",
  alertInfo: "#1a2630",
  alertInfoText: "#4fc3f7",
  alertWarning: "#332200",
  alertWarningText: "#ffb300",
  alertDanger: "#3d1a0a",
  alertDangerText: "#ff8a65",
  statusConnected: "#8bc34a",
  statusDisconnected: "#ff5722",
  deviceTypeTag: "#3a3a3a",
  deviceTypeTagText: "#ff9800",
  shadow: "0 1px 4px rgba(0,0,0,0.5)",
};

const ocean: ThemeTokens = {
  label: "Ocean",
  bgBody: "#0a1628",
  bgCard: "#0f2035",
  bgCardHeader: "#132940",
  bgNav: "#071020",
  bgInput: "#1a3350",
  bgControlPanel: "#0f2035",
  textPrimary: "#e0f0ff",
  textSecondary: "#90caf9",
  textMuted: "#5c8ab5",
  borderColor: "#1e3a5f",
  chartLine: "#00e5ff",
  chartFill: "rgba(0, 229, 255, 0.12)",
  chartGrid: "rgba(0, 229, 255, 0.06)",
  chartTick: "#5c8ab5",
  chartHover: "#18ffff",
  badgeTemp: "#ff5252",
  badgeTempText: "#ffffff",
  badgeHumidity: "#00e5ff",
  badgeHumidityText: "#071020",
  badgeBattery: "#69f0ae",
  badgeBatteryText: "#071020",
  btnPrimary: "#0288d1",
  btnPrimaryText: "#ffffff",
  btnSecondary: "#1a3350",
  btnSecondaryText: "#90caf9",
  alertInfo: "#0a2540",
  alertInfoText: "#4fc3f7",
  alertWarning: "#1a1800",
  alertWarningText: "#ffd54f",
  alertDanger: "#2a0a0a",
  alertDangerText: "#ef9a9a",
  statusConnected: "#69f0ae",
  statusDisconnected: "#ff5252",
  deviceTypeTag: "#1a3350",
  deviceTypeTagText: "#00e5ff",
  shadow: "0 1px 6px rgba(0,0,0,0.4)",
};

export const themes: Record<ThemeMode, ThemeTokens> = {
  light,
  dark,
  industrial,
  ocean,
};

export function applyTheme(mode: ThemeMode): void {
  const tokens = themes[mode];
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);

  const map: Record<string, string> = {
    "--bg-body": tokens.bgBody,
    "--bg-card": tokens.bgCard,
    "--bg-card-header": tokens.bgCardHeader,
    "--bg-nav": tokens.bgNav,
    "--bg-input": tokens.bgInput,
    "--bg-control-panel": tokens.bgControlPanel,
    "--text-primary": tokens.textPrimary,
    "--text-secondary": tokens.textSecondary,
    "--text-muted": tokens.textMuted,
    "--border-color": tokens.borderColor,
    "--chart-line": tokens.chartLine,
    "--chart-fill": tokens.chartFill,
    "--chart-grid": tokens.chartGrid,
    "--chart-tick": tokens.chartTick,
    "--chart-hover": tokens.chartHover,
    "--badge-temp": tokens.badgeTemp,
    "--badge-temp-text": tokens.badgeTempText,
    "--badge-humidity": tokens.badgeHumidity,
    "--badge-humidity-text": tokens.badgeHumidityText,
    "--badge-battery": tokens.badgeBattery,
    "--badge-battery-text": tokens.badgeBatteryText,
    "--btn-primary": tokens.btnPrimary,
    "--btn-primary-text": tokens.btnPrimaryText,
    "--btn-secondary": tokens.btnSecondary,
    "--btn-secondary-text": tokens.btnSecondaryText,
    "--alert-info": tokens.alertInfo,
    "--alert-info-text": tokens.alertInfoText,
    "--alert-warning": tokens.alertWarning,
    "--alert-warning-text": tokens.alertWarningText,
    "--alert-danger": tokens.alertDanger,
    "--alert-danger-text": tokens.alertDangerText,
    "--status-connected": tokens.statusConnected,
    "--status-disconnected": tokens.statusDisconnected,
    "--device-type-tag": tokens.deviceTypeTag,
    "--device-type-tag-text": tokens.deviceTypeTagText,
    "--shadow": tokens.shadow,
  };

  for (const [key, value] of Object.entries(map)) {
    root.style.setProperty(key, value);
  }
}

const STORAGE_KEY = "temp-master-theme";

export function loadTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in themes) {
    return stored as ThemeMode;
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function saveTheme(mode: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
}
