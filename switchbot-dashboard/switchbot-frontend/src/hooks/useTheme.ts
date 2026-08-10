import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'temp-master-theme'

type Theme = 'light' | 'dark'

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null
  }
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): Theme {
  return getStoredTheme() || getSystemTheme()
}

let currentTheme: Theme = getInitialTheme()
const listeners = new Set<() => void>()

function updateHtml(theme: Theme) {
  if (typeof document === 'undefined') {
    return
  }
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function emit() {
  listeners.forEach((callback) => callback())
}

function setTheme(theme: Theme) {
  if (currentTheme === theme) {
    return
  }
  currentTheme = theme
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, theme)
  }
  updateHtml(theme)
  emit()
}

function toggleTheme() {
  setTheme(currentTheme === 'light' ? 'dark' : 'light')
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot(): Theme {
  return currentTheme
}

// Apply the initial theme to <html> as early as possible.
updateHtml(currentTheme)

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => getInitialTheme(),
  )

  const toggle = useCallback(toggleTheme, [])

  return { theme, toggle, isDark: theme === 'dark' }
}
