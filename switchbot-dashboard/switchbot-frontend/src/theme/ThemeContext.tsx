import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type ThemeColors, getThemeByName, lightTheme } from "./themes";

interface ThemeContextValue {
  theme: ThemeColors;
  setThemeName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  setThemeName: () => {},
});

const STORAGE_KEY = "temp-master-theme";

function applyThemeToDom(theme: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty("--body-bg", theme.bodyBg);
  root.style.setProperty("--text-primary", theme.textPrimary);
  root.style.setProperty("--text-secondary", theme.textSecondary);
  root.style.setProperty("--navbar-bg", theme.navbarBg);
  root.style.setProperty("--navbar-text", theme.navbarText);
  root.style.setProperty("--navbar-border", theme.navbarBorder);
  root.style.setProperty("--panel-bg", theme.panelBg);
  root.style.setProperty("--panel-border", theme.panelBorder);
  root.style.setProperty("--panel-header-bg", theme.panelHeaderBg);
  root.style.setProperty("--input-bg", theme.inputBg);
  root.style.setProperty("--input-border", theme.inputBorder);
  root.style.setProperty("--input-text", theme.inputText);
  root.style.setProperty("--btn-primary-bg", theme.btnPrimaryBg);
  root.style.setProperty("--btn-primary-text", theme.btnPrimaryText);
  root.style.setProperty("--btn-default-bg", theme.btnDefaultBg);
  root.style.setProperty("--btn-default-text", theme.btnDefaultText);
  root.style.setProperty("--btn-default-border", theme.btnDefaultBorder);
  root.style.setProperty("--alert-info-bg", theme.alertInfoBg);
  root.style.setProperty("--alert-info-text", theme.alertInfoText);
  root.style.setProperty("--alert-info-border", theme.alertInfoBorder);
  root.style.setProperty("--alert-warning-bg", theme.alertWarningBg);
  root.style.setProperty("--alert-warning-text", theme.alertWarningText);
  root.style.setProperty("--alert-warning-border", theme.alertWarningBorder);
  root.style.setProperty("--alert-danger-bg", theme.alertDangerBg);
  root.style.setProperty("--alert-danger-text", theme.alertDangerText);
  root.style.setProperty("--alert-danger-border", theme.alertDangerBorder);
  root.style.setProperty("--badge-danger", theme.badgeDanger);
  root.style.setProperty("--badge-info", theme.badgeInfo);
  root.style.setProperty("--badge-success", theme.badgeSuccess);
  root.style.setProperty("--badge-text", theme.badgeText);
  root.style.setProperty("--tag-bg", theme.tagBg);
  root.style.setProperty("--tag-text", theme.tagText);
  root.style.setProperty("--footer-text", theme.footerText);
  root.style.setProperty("--scrollbar-track", theme.scrollbarTrack);
  root.style.setProperty("--scrollbar-thumb", theme.scrollbarThumb);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeColors>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? getThemeByName(saved) : lightTheme;
  });

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  const setThemeName = useCallback((name: string) => {
    const newTheme = getThemeByName(name);
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, name);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
