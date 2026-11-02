import { useTheme } from '../theme/useTheme'
import styles from './NavBar.module.css'

interface NavBarProps {
  connected: boolean
}

export function NavBar({ connected }: NavBarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <a className={styles.brand} href="#">
          Temp Master Dashboard
        </a>
        <a className={styles.activeLink} href="/">
          Dashboard
        </a>
        <div className={styles.actions}>
          <span
            className={`${styles.connectionBadge} ${connected ? styles.connected : styles.disconnected}`}
            data-testid="connection-status"
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            className={styles.themeButton}
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'dark'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </div>
    </nav>
  )
}
