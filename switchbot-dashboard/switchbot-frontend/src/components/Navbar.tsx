interface NavbarProps {
  connected: boolean;
}

export function Navbar({ connected }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">Temp Master Dashboard</span>
        <span className={`status-badge ${connected ? 'status-connected' : 'status-disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </nav>
  );
}
