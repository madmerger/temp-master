import { useTheme } from '../theme'

interface Props {
  connected: boolean
}

export function Navbar({ connected }: Props) {
  const { theme, toggleTheme } = useTheme()
  return (
    <nav className="navbar">
      <a className="navbar-brand" href="#">
        Temp Master Dashboard
      </a>
      <div className="navbar-nav">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <span
          className={`connection-status ${
            connected ? 'connected' : 'disconnected'
          }`}
        >
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </nav>
  )
}
