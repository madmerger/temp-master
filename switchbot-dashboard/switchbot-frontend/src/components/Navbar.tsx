import { ThemeSelector } from './ThemeSelector';
import type { ThemeId } from '../types';

interface NavbarProps {
  connected: boolean;
  themeId: ThemeId;
  onThemeChange: (id: ThemeId) => void;
}

export function Navbar({ connected, themeId, onThemeChange }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">Temp Master Dashboard</span>
        <div className="navbar-right">
          <ThemeSelector themeId={themeId} onChange={onThemeChange} />
          <span className={`badge ${connected ? 'badge-success' : 'badge-danger'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </nav>
  );
}
