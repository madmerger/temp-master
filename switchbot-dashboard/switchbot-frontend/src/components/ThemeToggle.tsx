import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../types'

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀' },
  { value: 'dark', label: 'Dark', icon: '☾' },
  { value: 'system', label: 'System', icon: '◐' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div role="group" className="inline-flex rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-800" aria-label="Theme">
      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
          data-testid={`theme-toggle-${value}`}
          onClick={() => setTheme(value)}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            theme === value
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span aria-hidden="true" className="mr-1">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
