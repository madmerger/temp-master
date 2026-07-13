import type { Theme } from "../theme";

interface Props {
  connected: boolean;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Navbar({ connected, theme, onToggleTheme }: Props) {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Temp Master Dashboard</span>
      <div className="navbar-right">
        <span className={`status-badge ${connected ? "connected" : "disconnected"}`}>
          <span aria-hidden="true">&#9679;</span>
          {connected ? "Connected" : "Disconnected"}
        </span>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
          title={theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
        >
          {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
        </button>
      </div>
    </nav>
  );
}
