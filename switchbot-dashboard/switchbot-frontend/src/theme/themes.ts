import { createTheme, type Theme } from "@mui/material/styles";

export interface ThemeMeta {
  id: string;
  label: string;
  description: string;
  /** Small swatch colors shown in the theme picker. */
  swatch: [string, string];
  /** Gradient used for the app header / hero accents. */
  headerGradient: string;
  theme: Theme;
}

const fontFamily = [
  "Inter",
  "Roboto",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Helvetica Neue",
  "Hiragino Sans",
  "Noto Sans JP",
  "sans-serif",
].join(",");

interface PaletteSpec {
  mode: "light" | "dark";
  primary: string;
  secondary: string;
  background: string;
  paper: string;
}

function buildTheme(spec: PaletteSpec): Theme {
  return createTheme({
    palette: {
      mode: spec.mode,
      primary: { main: spec.primary },
      secondary: { main: spec.secondary },
      background: { default: spec.background, paper: spec.paper },
    },
    typography: {
      fontFamily,
      h4: { fontWeight: 800, letterSpacing: -0.5 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle2: { fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${
              spec.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"
            }`,
            transition:
              "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600, borderRadius: 12 },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600 },
        },
      },
    },
  });
}

export const THEMES: ThemeMeta[] = [
  {
    id: "aurora",
    label: "Aurora Light",
    description: "明るくクリーンなデフォルト",
    swatch: ["#0ea5e9", "#f5f7fb"],
    headerGradient: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    theme: buildTheme({
      mode: "light",
      primary: "#0284c7",
      secondary: "#6366f1",
      background: "#f4f6fb",
      paper: "#ffffff",
    }),
  },
  {
    id: "midnight",
    label: "Midnight Dark",
    description: "目に優しいダークモード",
    swatch: ["#38bdf8", "#0b1220"],
    headerGradient: "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)",
    theme: buildTheme({
      mode: "dark",
      primary: "#38bdf8",
      secondary: "#a78bfa",
      background: "#0b1220",
      paper: "#131c2e",
    }),
  },
  {
    id: "carbon",
    label: "Carbon Industrial",
    description: "プラント計器盤風のダーク",
    swatch: ["#f59e0b", "#0a0a0a"],
    headerGradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    theme: buildTheme({
      mode: "dark",
      primary: "#f59e0b",
      secondary: "#ef4444",
      background: "#0a0a0c",
      paper: "#16161a",
    }),
  },
  {
    id: "forest",
    label: "Forest Calm",
    description: "落ち着いたグリーン系ライト",
    swatch: ["#059669", "#f1f5f0"],
    headerGradient: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
    theme: buildTheme({
      mode: "light",
      primary: "#059669",
      secondary: "#0ea5e9",
      background: "#f0f5f1",
      paper: "#ffffff",
    }),
  },
  {
    id: "sakura",
    label: "Sakura Rose",
    description: "やわらかなローズ系ライト",
    swatch: ["#db2777", "#fdf2f8"],
    headerGradient: "linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)",
    theme: buildTheme({
      mode: "light",
      primary: "#db2777",
      secondary: "#f59e0b",
      background: "#fdf3f8",
      paper: "#ffffff",
    }),
  },
];

export const DEFAULT_THEME_ID = "aurora";

export function getThemeMeta(id: string): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
