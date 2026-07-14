import { useTheme, type Theme } from "../theme/ThemeContext";

interface NavbarProps {
  connectionState: "loading" | "connected" | "disconnected";
}

const THEME_OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "aurora", label: "Aurora" },
];

export function Navbar({ connectionState }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const statusLabel = {
    loading: "Connecting",
    connected: "Connected",
    disconnected: "Disconnected",
  }[connectionState];

  return (
    <header className="navbar">
      <a className="brand" href="/" aria-label="Temp Master Dashboard home">
        <span className="brand-mark" aria-hidden="true">
          TM
        </span>
        <span>
          <strong>Temp Master Dashboard</strong>
          <small>Environmental monitoring</small>
        </span>
      </a>

      <div className="navbar-actions">
        <label className="theme-picker">
          <span>Theme</span>
          <select
            aria-label="Theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value as Theme)}
          >
            {THEME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className={`connection-status ${connectionState}`}>
          <span className="status-dot" aria-hidden="true" />
          {statusLabel}
        </div>
      </div>
    </header>
  );
}
