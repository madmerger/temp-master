import { ThemeSelector } from "../theme/ThemeSelector";

interface NavbarProps {
  connected: boolean;
}

export function Navbar({ connected }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a className="navbar-brand" href="/">
          Temp Master Dashboard
        </a>
        <div className="navbar-right">
          <ThemeSelector />
          <span
            className={`connection-badge ${connected ? "connected" : "disconnected"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </nav>
  );
}
