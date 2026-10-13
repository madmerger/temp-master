import { useTheme } from '../theme/useTheme'

interface NavbarProps {
  connected: boolean
}

export function Navbar({ connected }: NavbarProps) {
  const { theme, toggle } = useTheme()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a className="navbar-brand" href="/">
          Temp Master Dashboard
        </a>
        <ul className="navbar-nav">
          <li className="active">
            <a href="/">Dashboard</a>
          </li>
        </ul>
        <div className="navbar-actions">
          <span className={`label ${connected ? 'label-success' : 'label-danger'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            type="button"
            className="theme-toggle"
            aria-label="Toggle dark mode"
            aria-pressed={theme === 'dark'}
            onClick={toggle}
          >
            {theme === 'light' ? '☾ Dark' : '☀ Light'}
          </button>
        </div>
      </div>
    </nav>
  )
}
