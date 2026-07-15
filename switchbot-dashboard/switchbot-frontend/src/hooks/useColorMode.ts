import type { PaletteMode } from "@mui/material";
import { useEffect, useState } from "react";

const STORAGE_KEY = "temp-master-color-mode";

function getInitialMode(): PaletteMode {
  const savedMode = localStorage.getItem(STORAGE_KEY);
  if (savedMode === "light" || savedMode === "dark") {
    return savedMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useColorMode() {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggleMode = () => {
    setMode((currentMode) => (currentMode === "light" ? "dark" : "light"));
  };

  return { mode, toggleMode };
}
