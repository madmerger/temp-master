import { useTheme } from '../theme'
import { THEMES, type ThemeId } from '../themes'

export default function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme()

  return (
    <div className="theme-switcher">
      <label htmlFor="theme-select">Theme:</label>
      <select
        id="theme-select"
        value={themeId}
        onChange={(e) => setThemeId(e.target.value as ThemeId)}
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  )
}
