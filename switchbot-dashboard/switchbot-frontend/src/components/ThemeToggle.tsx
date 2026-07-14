import { useTheme } from '../theme/ThemeContext'
import { MoonIcon, SunIcon } from './icons'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
