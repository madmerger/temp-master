import { useState, useLayoutEffect, useCallback } from "react";
import type { ThemeMode } from "../types";
import { applyTheme, loadTheme, saveTheme } from "../theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(loadTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    saveTheme(mode);
    applyTheme(mode);
  }, []);

  return { theme, setTheme };
}
