import { useTheme } from '../context/ThemeContext'

interface NavbarProps {
  connected: boolean
}

export function Navbar({ connected }: NavbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="navbar">
      <span className="navbar-brand">Temp Master Dashboard</span>
      <div className="navbar-right">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'
          }
        >
          {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
        </button>
        <span className={connected ? 'label label-success' : 'label label-danger'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </nav>
  )
}
