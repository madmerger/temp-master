import { useTheme } from '../theme/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} theme`}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export const ConnectionStatus = ({ connected }: { connected: boolean }) => (
  <span className={`badge ${connected ? 'badge-success' : 'badge-danger'}`}>
    {connected ? 'Connected' : 'Disconnected'}
  </span>
);

export const Navbar = ({ isConnected }: { isConnected: boolean }) => (
  <nav className="navbar">
    <div className="navbar-inner">
      <a className="navbar-brand" href="/">Temp Master Dashboard</a>
      <a className="navbar-link" href="/">Dashboard</a>
      <div className="navbar-actions">
        <ThemeToggle />
        <ConnectionStatus connected={isConnected} />
      </div>
    </div>
  </nav>
);
