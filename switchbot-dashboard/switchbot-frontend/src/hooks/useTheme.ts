import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'temp-master-theme'

type Theme = 'light' | 'dark'

const isBrowser = typeof window !== 'undefined'

function getStoredTheme(): Theme | null {
  if (!isBrowser) {
    return null
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    return stored
  } catch {
    return null
  }
}

function getSystemTheme(): Theme {
  if (!isBrowser) {
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

export function setTheme(theme: Theme) {
  if (currentTheme === theme) {
    return
  }
  currentTheme = theme
  if (isBrowser) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }
  updateHtml(theme)
  emit()
}

export function toggleTheme() {
  setTheme(currentTheme === 'light' ? 'dark' : 'light')
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot(): Theme {
  return currentTheme
}

function handleStorageChange(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) {
    return
  }
  const next = (event.newValue as Theme | null) || getSystemTheme()
  setTheme(next)
}

function handleSystemThemeChange(event: MediaQueryListEvent) {
  if (getStoredTheme()) {
    return
  }
  setTheme(event.matches ? 'dark' : 'light')
}

if (isBrowser) {
  window.addEventListener('storage', handleStorageChange)
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', handleSystemThemeChange)
}

// Apply the initial theme to <html> as early as possible.
updateHtml(currentTheme)

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getInitialTheme,
  )

  return { theme, toggle: toggleTheme, isDark: theme === 'dark' }
}
