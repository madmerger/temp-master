import Badge from './Badge';
import styles from './Navbar.module.css';

interface NavbarProps {
  connected: boolean;
}

// 画面上部に固定表示するナビバー（ブランド名・接続ステータス）
export default function Navbar({ connected }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <a className={styles.brand} href="#">
          Temp Master Dashboard
        </a>
        <ul className={styles.nav}>
          <li className={styles.active}>
            <a href="/">Dashboard</a>
          </li>
        </ul>
        <div className={styles.status}>
          <Badge variant={connected ? 'success' : 'danger'}>
            <span id="connection-status">{connected ? 'Connected' : 'Disconnected'}</span>
          </Badge>
        </div>
      </div>
    </nav>
  );
}
