import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const PREFERENCE_KEY = 'temp-master-theme'
const SYSTEM_DARK = '(prefers-color-scheme: dark)'
const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const
type Theme = (typeof OPTIONS)[number]['value']

function getTheme(): Theme {
  try {
    const value = localStorage.getItem(PREFERENCE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    // The system theme still works when browser storage is unavailable.
  }
  return 'system'
}

export function ThemeControl() {
  const [theme, setTheme] = useState(getTheme)

  useEffect(() => {
    const media = matchMedia(SYSTEM_DARK)
    const apply = () => document.documentElement.classList.toggle(
      'dark',
      theme === 'dark' || (theme === 'system' && media.matches),
    )

    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  function select(value: Theme) {
    setTheme(value)
    try {
      localStorage.setItem(PREFERENCE_KEY, value)
    } catch {
      // The choice remains active for this page when storage is unavailable.
    }
  }

  return (
    <div role="group" aria-label="Color theme" className="flex items-center gap-0.5 rounded-lg border border-line bg-canvas p-1">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={theme === value}
          className="rounded-md p-1.5 text-muted hover:text-ink aria-pressed:bg-surface aria-pressed:text-primary aria-pressed:shadow-xs"
          onClick={() => select(value)}
        >
          <Icon aria-hidden="true" size={16} />
        </button>
      ))}
    </div>
  )
}
