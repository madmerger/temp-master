import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { themeColors, themes, type Theme } from './theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  let saved: Theme | null = null
  try {
    saved = localStorage.getItem('temp-master-theme') as Theme | null
  } catch {
    saved = null
  }

  if (saved && themes.some((item) => item.value === saved)) {
    return saved
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .getElementById('theme-color')
      ?.setAttribute('content', themeColors[theme])

    try {
      localStorage.setItem('temp-master-theme', theme)
    } catch {
      // Storage may be unavailable in privacy-restricted environments.
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
