import { themes } from '../theme'
import { useTheme } from '../ThemeContext'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const confirmCurrentTheme = () => setTheme(theme)

  return (
    <label className="text-sm">
      <span className="sr-only">Theme</span>
      <select
        aria-label="Theme"
        className="rounded-md border border-border bg-surface-raised px-3 py-2 text-ink"
        onClick={confirmCurrentTheme}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' ' ||
            event.key === 'ArrowDown' ||
            event.key === 'ArrowUp'
          ) {
            confirmCurrentTheme()
          }
        }}
        value={theme}
        onChange={(event) => setTheme(event.target.value as typeof theme)}
      >
        {themes.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}
