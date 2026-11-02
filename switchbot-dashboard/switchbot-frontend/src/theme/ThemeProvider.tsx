import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { THEME_STORAGE_KEY } from '../config'
import { ThemeContext, type Theme } from './ThemeContext'

function getStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function getPreferredTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => getStoredTheme() ?? getPreferredTheme(),
  )
  const [hasStoredPreference, setHasStoredPreference] = useState(
    () => getStoredTheme() !== null,
  )

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
      setHasStoredPreference(true)
    } catch {
      setHasStoredPreference(false)
    }
    setTheme(nextTheme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    if (hasStoredPreference) {
      return
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [hasStoredPreference])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
