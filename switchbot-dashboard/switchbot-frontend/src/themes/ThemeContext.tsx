import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system' | 'high-contrast'

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark' | 'high-contrast'
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'temp-master-theme'

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' | 'high-contrast' {
  if (theme === 'system') return getSystemPreference()
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (
      stored === 'light' ||
      stored === 'dark' ||
      stored === 'system' ||
      stored === 'high-contrast'
    ) {
      return stored
    }
    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<
    'light' | 'dark' | 'high-contrast'
  >(() => resolveTheme(theme))

  const applyTheme = useCallback((resolved: 'light' | 'dark' | 'high-contrast') => {
    const root = document.documentElement
    root.classList.remove('dark', 'high-contrast')
    if (resolved === 'dark') {
      root.classList.add('dark')
    } else if (resolved === 'high-contrast') {
      root.classList.add('dark', 'high-contrast')
    }
  }, [])

  useEffect(() => {
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [theme, applyTheme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = resolveTheme('system')
      setResolvedTheme(resolved)
      applyTheme(resolved)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, applyTheme])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, newTheme)
    setThemeState(newTheme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
