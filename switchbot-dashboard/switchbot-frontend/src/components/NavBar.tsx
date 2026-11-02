import { useTheme } from '../theme/useTheme';
import styles from './NavBar.module.css';

interface NavBarProps {
  connected: boolean;
}

export default function NavBar({ connected }: NavBarProps) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <header className={styles.navbar}>
      <a className={styles.brand} href="/">
        Temp Master Dashboard
      </a>
      <a className={styles.activeLink} href="/" aria-current="page">
        Dashboard
      </a>
      <div className={styles.actions}>
        <span className={connected ? styles.connected : styles.disconnected}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <button
          className={styles.themeToggle}
          type="button"
          aria-label={`Switch to ${nextTheme} mode`}
          data-testid="theme-toggle"
          onClick={toggleTheme}
        >
          <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>
    </header>
  );
}
