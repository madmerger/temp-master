import styles from './Navbar.module.css';

interface NavbarProps {
  connected: boolean;
}

export default function Navbar({ connected }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <a className={styles.brand} href="#">
          Temp Master Dashboard
        </a>
        <a className={`${styles.link} ${styles.active}`} href="/">
          Dashboard
        </a>
        <span className={`${styles.status} ${connected ? styles.success : styles.danger}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </nav>
  );
}
