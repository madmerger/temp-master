import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export interface ChartColors {
  grid: string;
  axis: string;
  line: string;
  fill: string;
}

// Chart colors are derived directly from the theme value (kept in sync with the
// CSS variables in styles.css). Reading them from computed CSS is unreliable
// because the child chart effect runs before the parent sets `data-theme`.
export const CHART_COLORS: Record<Theme, ChartColors> = {
  light: {
    grid: "rgba(15, 23, 42, 0.08)",
    axis: "#94a3b8",
    line: "#dc2626",
    fill: "rgba(220, 38, 38, 0.15)",
  },
  dark: {
    grid: "rgba(148, 163, 184, 0.15)",
    axis: "#64748b",
    line: "#f87171",
    fill: "rgba(248, 113, 113, 0.2)",
  },
};

const STORAGE_KEY = "temp-master-theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (e.g. private browsing)
  }
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable (e.g. private browsing)
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
