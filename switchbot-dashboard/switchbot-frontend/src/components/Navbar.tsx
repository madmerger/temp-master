import styles from './Navbar.module.css';

interface NavbarProps {
  connected: boolean;
}

export function Navbar({ connected }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <span className={styles.brand}>Temp Master Dashboard</span>
        <span className={connected ? styles.badgeConnected : styles.badgeDisconnected}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </nav>
  );
}
