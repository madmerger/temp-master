import { useEffect, useState } from 'react'
import { themes, type Theme } from '../theme'

function initialTheme(): Theme {
  const saved = localStorage.getItem('temp-master-theme') as Theme | null
  if (saved && themes.some((theme) => theme.value === saved)) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('temp-master-theme', theme)
  }, [theme])
  return (
    <label className="theme-switcher">
      <span className="sr-only">Theme</span>
      <select aria-label="Theme" value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
        {themes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  )
}
