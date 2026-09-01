import type { Theme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  connected: boolean;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Header({ connected, theme, onToggleTheme }: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-slate-900 dark:text-white">
            Temp Master Dashboard
          </span>
          <nav className="hidden sm:block">
            <a
              href="/"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Dashboard
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`badge-base ${connected ? 'bg-green-600' : 'bg-red-600'}`}
            data-testid="connection-status"
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
