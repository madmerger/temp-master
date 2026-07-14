import type { Theme } from '../hooks/useTheme'
import styles from './Navbar.module.css'

interface NavbarProps {
  connected: boolean
  theme: Theme
  onToggleTheme: () => void
}

export default function Navbar({ connected, theme, onToggleTheme }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <span className={styles.brand}>Temp Master Dashboard</span>
      <div className={styles.right}>
        <span
          className={`${styles.status} ${
            connected ? styles.connected : styles.disconnected
          }`}
        >
          <span className={styles.dot} />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'}
          title={theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}
