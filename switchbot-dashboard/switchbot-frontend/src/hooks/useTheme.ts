import { useEffect, useState } from 'react'
import { applyTheme, getInitialTheme, type Theme } from '../theme'

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggleTheme(): void {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  return { theme, toggleTheme }
}
