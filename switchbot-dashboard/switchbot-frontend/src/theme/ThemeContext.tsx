import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  DEFAULT_THEME_ID,
  getThemeMeta,
  THEMES,
  type ThemeMeta,
} from "./themes";

const STORAGE_KEY = "temp-master-theme";

interface ThemeContextValue {
  themeId: string;
  meta: ThemeMeta;
  themes: ThemeMeta[];
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.some((t) => t.id === stored)) return stored;
  return DEFAULT_THEME_ID;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(readStoredTheme);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const meta = useMemo(() => getThemeMeta(themeId), [themeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeId, meta, themes: THEMES, setThemeId }),
    [themeId, meta, setThemeId],
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={meta.theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return ctx;
}
