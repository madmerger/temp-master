import { ThemeToggle } from './ThemeToggle'

export function Navbar({ connected }: { connected: boolean }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="logo-dot" />
        Temp Master Dashboard
      </div>
      <div className="navbar-right">
        <span className={`status-pill ${connected ? 'connected' : 'disconnected'}`}>
          <span className="dot" />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <ThemeToggle />
      </div>
    </nav>
  )
}
