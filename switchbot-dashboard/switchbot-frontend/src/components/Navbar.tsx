import type { ThemeMode } from "../types";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface NavbarProps {
  connected: boolean;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export function Navbar({ connected, theme, onThemeChange }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a className="navbar-brand" href="/">
          Temp Master Dashboard
        </a>
        <div className="navbar-right">
          <ThemeSwitcher current={theme} onChange={onThemeChange} />
          <span
            className={`status-badge ${connected ? "connected" : "disconnected"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </nav>
  );
}
