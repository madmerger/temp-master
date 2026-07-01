import { useTheme } from "./ThemeContext";
import { themes } from "./themes";

export function ThemeSelector() {
  const { theme, setThemeName } = useTheme();

  return (
    <select
      className="form-select"
      value={theme.name}
      onChange={(e) => setThemeName(e.target.value)}
      aria-label="Theme"
    >
      {themes.map((t) => (
        <option key={t.name} value={t.name}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
