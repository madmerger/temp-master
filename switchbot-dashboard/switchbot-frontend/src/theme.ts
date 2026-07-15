import type { PaletteMode } from "@mui/material";
import { createTheme } from "@mui/material/styles";

export function createDashboardTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? "#38bdf8" : "#0284c7" },
      secondary: { main: isDark ? "#a78bfa" : "#7c3aed" },
      background: {
        default: isDark ? "#090e1a" : "#f3f6fb",
        paper: isDark ? "#111827" : "#ffffff",
      },
      error: { main: isDark ? "#fb7185" : "#e11d48" },
      warning: { main: isDark ? "#fbbf24" : "#d97706" },
      success: { main: isDark ? "#34d399" : "#059669" },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily:
        '"Inter", "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontWeight: 800, letterSpacing: "-0.03em" },
      h2: { fontWeight: 750, letterSpacing: "-0.02em" },
      button: { fontWeight: 700, textTransform: "none" },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${
              isDark ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)"
            }`,
            boxShadow: isDark
              ? "0 18px 45px rgba(0, 0, 0, 0.18)"
              : "0 18px 45px rgba(15, 23, 42, 0.07)",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 10 } },
      },
    },
  });
}
