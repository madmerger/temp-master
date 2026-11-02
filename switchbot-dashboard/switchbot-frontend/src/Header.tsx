import { useTheme } from './useTheme';

interface HeaderProps {
  connected: boolean;
}

export function Header({ connected }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="brand" href="/">
          Temp Master Dashboard
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-link active" href="/">
            Dashboard
          </a>
        </nav>
        <div className="header-actions">
          <span
            className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}
            role="status"
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${nextTheme} mode`}
            aria-pressed={theme === 'dark'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </header>
  );
}
