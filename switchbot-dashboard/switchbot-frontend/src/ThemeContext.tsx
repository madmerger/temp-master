import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { themeColors, themes, type Theme } from './theme'

const THEME_STORAGE_KEY = 'temp-master-theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    return saved && themes.some((item) => item.value === saved) ? saved : null
  } catch {
    return null
  }
}

function getInitialTheme(): Theme {
  const saved = getStoredTheme()
  if (saved) {
    return saved
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [hasStoredTheme, setHasStoredTheme] = useState(() => getStoredTheme() !== null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .getElementById('theme-color')
      ?.setAttribute('content', themeColors[theme])
  }, [hasStoredTheme, theme])

  useEffect(() => {
    if (hasStoredTheme) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handlePreferenceChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handlePreferenceChange)
    return () => mediaQuery.removeEventListener('change', handlePreferenceChange)
  }, [hasStoredTheme])

  const selectTheme = (nextTheme: Theme) => {
    setHasStoredTheme(true)
    setTheme(nextTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // Storage may be unavailable in privacy-restricted environments.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: selectTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
