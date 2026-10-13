import { useContext } from 'react'
import { ThemeContext } from './Theme'
import type { Theme } from './Theme'

export function useTheme(): { theme: Theme; toggle: () => void } {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
