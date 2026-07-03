import { useTheme } from '../themes/ThemeContext'
import type { ThemeMode } from '../themes/ThemeContext'

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '\u2600\uFE0F' },
  { value: 'dark', label: 'Dark', icon: '\uD83C\uDF19' },
  { value: 'system', label: 'System', icon: '\uD83D\uDCBB' },
  { value: 'high-contrast', label: 'High Contrast', icon: '\uD83D\uDD32' },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="relative inline-block">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeMode)}
        className="appearance-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 pr-8 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
      >
        {THEME_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg
          className="h-4 w-4 text-[var(--color-text-secondary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}
