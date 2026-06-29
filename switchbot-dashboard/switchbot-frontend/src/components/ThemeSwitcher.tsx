import type { ThemeMode } from "../types";
import { themes } from "../theme";

interface ThemeSwitcherProps {
  current: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

const themeEntries = Object.entries(themes) as [ThemeMode, (typeof themes)[ThemeMode]][];

export function ThemeSwitcher({ current, onChange }: ThemeSwitcherProps) {
  return (
    <div className="theme-switcher">
      {themeEntries.map(([key, tokens]) => (
        <button
          key={key}
          className={`theme-btn ${current === key ? "active" : ""}`}
          onClick={() => onChange(key)}
          title={tokens.label}
        >
          <span
            className="theme-swatch"
            style={{
              background: `linear-gradient(135deg, ${tokens.bgBody} 50%, ${tokens.chartLine} 50%)`,
            }}
          />
          <span className="theme-label">{tokens.label}</span>
        </button>
      ))}
    </div>
  );
}
