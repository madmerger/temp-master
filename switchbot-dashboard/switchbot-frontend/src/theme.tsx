import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_THEME, getTheme, isThemeId, type ThemeId, type ThemeMeta } from './themes'

const STORAGE_KEY = 'temp-master-theme'

interface ThemeContextValue {
  themeId: ThemeId
  theme: ThemeMeta
  setThemeId: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isThemeId(stored)) return stored
  } catch {
    // localStorage may be unavailable (e.g. file:// or privacy mode).
  }
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // Ignore persistence errors.
    }
  }, [themeId])

  const value = useMemo<ThemeContextValue>(
    () => ({ themeId, theme: getTheme(themeId), setThemeId: setThemeIdState }),
    [themeId],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
